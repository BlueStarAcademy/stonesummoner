import {
  type BgmId,
  type SfxId,
  type StingId,
  bgmSrcCandidates,
  sfxPlayCap,
  sfxSrcCandidates,
} from "./catalog";
import { readAudioPrefs, writeAudioPrefs, type AudioPrefs } from "./prefs";

const DUCK_BGM = 0.28;

type MissingKey = string;

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxBus: GainNode | null = null;
let bgmGain: GainNode | null = null;
let bgmSource: AudioBufferSourceNode | null = null;
let bgmBuffer: AudioBuffer | null = null;
/** `ctx.currentTime` when the current BGM source started. */
let bgmStartedAt = 0;
/** Offset (seconds) into the buffer at start — used to resume after stop. */
let bgmOffset = 0;
let currentBgm: BgmId | null = null;
let pendingBgm: BgmId | null = null;
let bgmGen = 0;
let unlocked = false;
let hiddenPaused = false;
let ducking = false;
let prefs: AudioPrefs = readAudioPrefs();

const bufferCache = new Map<string, AudioBuffer | null>();
const missing = new Set<MissingKey>();
const resolving = new Map<string, Promise<string | null>>();

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** BGM output lives entirely on a fresh GainNode so slider moves actually take effect. */
function bgmOutValue(): number {
  if (prefs.muted) return 0;
  return clamp01(prefs.master * prefs.bgm * (ducking ? DUCK_BGM : 1));
}

function sfxVoiceValue(extra = 1): number {
  if (prefs.muted) return 0;
  return clamp01(prefs.master * prefs.sfx * extra);
}

function snapGain(node: GainNode, value: number): void {
  const v = clamp01(value);
  node.gain.value = v;
  if (!ctx) return;
  const t = ctx.currentTime;
  try {
    node.gain.cancelScheduledValues(t);
    node.gain.setValueAtTime(v, t);
    node.gain.setValueAtTime(v, t + 0.05);
  } catch {
    node.gain.value = v;
  }
}

function makeGain(value: number): GainNode {
  if (!ctx) throw new Error("audio ctx");
  const v = clamp01(value);
  try {
    const node = new GainNode(ctx, { gain: v });
    snapGain(node, v);
    return node;
  } catch {
    const node = ctx.createGain();
    snapGain(node, v);
    return node;
  }
}

/**
 * Live AudioParam updates are ignored in some Chromium/WebViews.
 * Swap in a new GainNode (constructor gain applies) and reattach the playing bed.
 */
function replaceBgmGain(): void {
  if (!ctx || !masterGain) return;
  const next = makeGain(bgmOutValue());
  if (bgmSource) {
    try {
      bgmSource.disconnect();
    } catch {
      /* ignore */
    }
    bgmSource.connect(next);
  }
  if (bgmGain) {
    try {
      bgmGain.disconnect();
    } catch {
      /* ignore */
    }
  }
  next.connect(masterGain);
  bgmGain = next;
}

function applyGains(): void {
  replaceBgmGain();
}

/** Mute must actually stop the bed — GainNode.value is ignored in some WebViews. */
function syncBgmMutePlayback(): void {
  if (prefs.muted) {
    if (bgmSource) stopBgmSource(true);
    return;
  }
  if (!currentBgm || bgmSource || !bgmBuffer || !ctx || !unlocked) return;
  startBgmSource(bgmBuffer, bgmOffset);
}

function clearMediaSession(): void {
  try {
    const ms = navigator.mediaSession;
    if (!ms) return;
    ms.metadata = null;
    ms.playbackState = "none";
  } catch {
    /* ignore */
  }
}

async function ensureCtx(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      sfxBus = ctx.createGain();
      bgmGain = ctx.createGain();
      sfxBus.connect(masterGain);
      bgmGain.connect(masterGain);
      masterGain.connect(ctx.destination);
      applyGains();
      clearMediaSession();
    }
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => undefined);
      applyGains();
    }
    return ctx;
  } catch {
    return null;
  }
}

async function probeUrl(url: string): Promise<boolean> {
  if (missing.has(url)) return false;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-1" },
      cache: "no-store",
    });
    if (res.ok || res.status === 206) return true;
  } catch {
    /* missing */
  }
  missing.add(url);
  return false;
}

async function firstExisting(urls: string[]): Promise<string | null> {
  const key = urls.join("|");
  const hit = resolving.get(key);
  if (hit) return hit;
  const work = (async () => {
    for (const url of urls) {
      if (await probeUrl(url)) return url;
    }
    return null;
  })();
  resolving.set(key, work);
  return work;
}

async function decodeAudio(url: string): Promise<AudioBuffer | null> {
  const cached = bufferCache.get(url);
  if (cached !== undefined) return cached;
  const audio = await ensureCtx();
  if (!audio) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      bufferCache.set(url, null);
      return null;
    }
    const raw = await res.arrayBuffer();
    const buf = await audio.decodeAudioData(raw.slice(0));
    bufferCache.set(url, buf);
    return buf;
  } catch {
    bufferCache.set(url, null);
    return null;
  }
}

function currentBgmPlayhead(): number {
  if (!ctx || !bgmBuffer) return bgmOffset;
  if (!bgmSource) return bgmOffset;
  const elapsed = Math.max(0, ctx.currentTime - bgmStartedAt);
  const dur = bgmBuffer.duration;
  if (!(dur > 0)) return 0;
  return (bgmOffset + elapsed) % dur;
}

function stopBgmSource(preserveOffset: boolean): void {
  if (preserveOffset) bgmOffset = currentBgmPlayhead();
  else bgmOffset = 0;
  if (bgmSource) {
    try {
      bgmSource.onended = null;
      bgmSource.stop();
    } catch {
      /* already stopped */
    }
    try {
      bgmSource.disconnect();
    } catch {
      /* ignore */
    }
    bgmSource = null;
  }
  if (!preserveOffset) bgmBuffer = null;
}

function startBgmSource(buf: AudioBuffer, offsetSec: number): void {
  if (!ctx || !masterGain) return;
  stopBgmSource(true);
  bgmBuffer = buf;
  const dur = buf.duration;
  const offset = dur > 0 ? ((offsetSec % dur) + dur) % dur : 0;
  bgmOffset = offset;
  replaceBgmGain();
  if (prefs.muted || !pageIsAudible()) {
    clearMediaSession();
    return;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.connect(bgmGain!);
  bgmStartedAt = ctx.currentTime;
  try {
    src.start(0, offset);
  } catch {
    bgmSource = null;
    return;
  }
  bgmSource = src;
  clearMediaSession();
}

export function getAudioPrefs(): AudioPrefs {
  return { ...prefs };
}

export function setAudioPrefs(patch: Partial<AudioPrefs>): AudioPrefs {
  prefs = {
    ...prefs,
    ...patch,
    master:
      patch.master != null
        ? Math.min(1, Math.max(0, patch.master))
        : prefs.master,
    bgm: patch.bgm != null ? Math.min(1, Math.max(0, patch.bgm)) : prefs.bgm,
    sfx: patch.sfx != null ? Math.min(1, Math.max(0, patch.sfx)) : prefs.sfx,
  };
  writeAudioPrefs(prefs);
  applyGains();
  syncBgmMutePlayback();
  return getAudioPrefs();
}

function pageIsAudible(): boolean {
  if (typeof document === "undefined") return false;
  if (document.hidden) return false;
  if (document.visibilityState && document.visibilityState !== "visible") {
    return false;
  }
  // Cursor / VS Code Simple Browser often keeps visibility "visible" while unfocused.
  if (typeof document.hasFocus === "function" && !document.hasFocus()) {
    return false;
  }
  return true;
}

export async function unlockAudio(): Promise<void> {
  unlocked = true;
  await ensureCtx();
  applyGains();
  if (prefs.muted || !pageIsAudible()) return;
  if (bgmSource && ctx?.state === "running") return;
  const want = pendingBgm ?? currentBgm;
  if (!want) return;
  pendingBgm = null;
  const resumeOffset = bgmSource ? currentBgmPlayhead() : bgmOffset;
  currentBgm = null;
  await playBgm(want, { resumeOffset });
}

let audioListeners: AbortController | null = null;

function onAudioBackground(): void {
  hiddenPaused = true;
  void suspendAudioPlayback();
}

function onAudioForeground(): void {
  if (!pageIsAudible()) {
    hiddenPaused = true;
    void suspendAudioPlayback();
    return;
  }
  if (!ctx) {
    hiddenPaused = false;
    return;
  }
  void ctx.resume().catch(() => undefined);
  applyGains();
  if (currentBgm && !prefs.muted && !bgmSource) {
    void playBgm(currentBgm, { resumeOffset: bgmOffset });
  }
  hiddenPaused = false;
}

export function initAudio(): void {
  prefs = readAudioPrefs();
  if (typeof document === "undefined") return;
  if (audioListeners) return;
  audioListeners = new AbortController();
  const { signal } = audioListeners;
  const unlock = (): void => {
    void unlockAudio();
  };
  document.addEventListener("pointerdown", unlock, { capture: true, once: true, signal });
  document.addEventListener("keydown", unlock, { capture: true, once: true, signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (!pageIsAudible()) onAudioBackground();
      else onAudioForeground();
    },
    { signal },
  );
  window.addEventListener("pagehide", () => onAudioBackground(), { signal });
  window.addEventListener(
    "pageshow",
    () => {
      if (pageIsAudible()) onAudioForeground();
      else onAudioBackground();
    },
    { signal },
  );
  window.addEventListener("beforeunload", () => onAudioBackground(), { signal });
  window.addEventListener("blur", () => onAudioBackground(), { signal });
  window.addEventListener(
    "focus",
    () => {
      if (pageIsAudible()) onAudioForeground();
      else onAudioBackground();
    },
    { signal },
  );
  document.addEventListener("freeze", () => onAudioBackground(), { signal });
  void import("@capacitor/core")
    .then(async ({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return;
      const { App } = await import("@capacitor/app");
      void App.addListener("pause", () => {
        onAudioBackground();
      });
      void App.addListener("resume", () => {
        onAudioForeground();
      });
      void App.addListener("appStateChange", (state) => {
        if (state.isActive) onAudioForeground();
        else onAudioBackground();
      });
    })
    .catch(() => undefined);
}

export async function playBgm(
  id: BgmId | null,
  opts?: { resumeOffset?: number },
): Promise<void> {
  if (!id) {
    await stopBgm();
    return;
  }

  const audio = await ensureCtx();
  if (!audio || !bgmGain) {
    pendingBgm = id;
    return;
  }

  const sameTrack = id === currentBgm;
  if (sameTrack && bgmSource) {
    applyGains();
    clearMediaSession();
    return;
  }
  if (sameTrack && bgmBuffer) {
    startBgmSource(bgmBuffer, opts?.resumeOffset ?? bgmOffset);
    pendingBgm = null;
    return;
  }

  const gen = ++bgmGen;
  const resumeOffset =
    opts?.resumeOffset ?? (sameTrack ? bgmOffset : 0);
  currentBgm = id;
  pendingBgm = id;
  stopBgmSource(sameTrack);

  const url = await firstExisting(bgmSrcCandidates(id));
  if (gen !== bgmGen) return;
  if (!url) return;

  const buf = await decodeAudio(url);
  if (gen !== bgmGen) return;
  if (!buf) return;

  if (!pageIsAudible() || (!unlocked && audio.state !== "running")) {
    pendingBgm = id;
    bgmBuffer = buf;
    bgmOffset = resumeOffset;
    return;
  }

  try {
    startBgmSource(buf, resumeOffset);
  } catch {
    if (gen === bgmGen) pendingBgm = id;
    return;
  }
  if (gen !== bgmGen) return;
  pendingBgm = null;
}

export async function stopBgm(): Promise<void> {
  bgmGen += 1;
  currentBgm = null;
  pendingBgm = null;
  stopBgmSource(false);
}

/** Pause beds when the activity backgrounds — Android finish() often skips document.hidden. */
export async function suspendAudioPlayback(): Promise<void> {
  if (bgmSource) bgmOffset = currentBgmPlayhead();
  stopBgmSource(true);
  clearMediaSession();
  if (masterGain) snapGain(masterGain, 0);
  if (ctx && ctx.state === "running") {
    await ctx.suspend().catch(() => undefined);
  }
}

/** Tear down Web Audio so BGM cannot leak after Activity.finish(). */
export async function haltAudioForExit(): Promise<void> {
  audioListeners?.abort();
  audioListeners = null;
  await stopBgm();
  clearMediaSession();
  if (masterGain) snapGain(masterGain, 0);
  if (!ctx) return;
  const audio = ctx;
  ctx = null;
  masterGain = null;
  sfxBus = null;
  bgmGain = null;
  try {
    await audio.suspend();
  } catch {
    /* ignore */
  }
  try {
    await audio.close();
  } catch {
    /* ignore */
  }
}

export function duckBgm(on: boolean): void {
  ducking = on;
  applyGains();
}

export async function playSfx(
  id: SfxId | StingId,
  opts?: { gain?: number },
): Promise<void> {
  if (prefs.muted) return;
  const audio = await ensureCtx();
  if (!audio || !sfxBus || prefs.muted) return;
  const url = await firstExisting(sfxSrcCandidates(id));
  if (!url || prefs.muted) return;
  const buf = await decodeAudio(url);
  if (!buf || prefs.muted) return;
  const voice = sfxVoiceValue(opts?.gain ?? 1);
  if (voice <= 0) return;
  try {
    const src = audio.createBufferSource();
    src.buffer = buf;
    const g = (() => {
      try {
        return new GainNode(audio, { gain: voice });
      } catch {
        const node = audio.createGain();
        node.gain.value = voice;
        return node;
      }
    })();
    snapGain(g, voice);
    src.connect(g);
    g.connect(sfxBus);
    src.start();
    const cap = sfxPlayCap(id);
    if (cap != null && buf.duration > cap) {
      const t = audio.currentTime;
      const fade = Math.min(0.04, cap * 0.25);
      g.gain.setValueAtTime(voice, t + Math.max(0, cap - fade));
      g.gain.linearRampToValueAtTime(0, t + cap);
      src.stop(t + cap + 0.02);
    }
  } catch {
    /* ignore */
  }
}

export function currentBgmId(): BgmId | null {
  return currentBgm;
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    void haltAudioForExit();
  });
}
