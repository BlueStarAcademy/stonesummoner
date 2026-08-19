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
let bgmEl: HTMLAudioElement | null = null;
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

function ensureBgmEl(): HTMLAudioElement {
  if (bgmEl) return bgmEl;
  const el = new Audio();
  el.preload = "auto";
  el.loop = true;
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "");
  bgmEl = el;
  return el;
}

function stopBgmEl(): void {
  if (!bgmEl) return;
  bgmEl.pause();
  bgmEl.volume = 0;
}

function bgmElementVolume(): number {
  if (prefs.muted) return 0;
  return Math.min(1, Math.max(0, prefs.master * prefs.bgm * (ducking ? DUCK_BGM : 1)));
}

function applyGains(): void {
  if (masterGain && sfxBus) {
    const mute = prefs.muted ? 0 : 1;
    masterGain.gain.value = prefs.master * mute;
    sfxBus.gain.value = prefs.sfx;
  }
  if (bgmEl) bgmEl.volume = bgmElementVolume();
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
      sfxBus.connect(masterGain);
      masterGain.connect(ctx.destination);
      applyGains();
    }
    if (ctx.state === "suspended") {
      await ctx.resume().catch(() => undefined);
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

async function decodeSfx(url: string): Promise<AudioBuffer | null> {
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
  return getAudioPrefs();
}

export async function unlockAudio(): Promise<void> {
  unlocked = true;
  await ensureCtx();
  if (bgmEl && !bgmEl.paused) return;
  const want = pendingBgm ?? currentBgm;
  if (!want) return;
  pendingBgm = null;
  currentBgm = null;
  await playBgm(want);
}

export function initAudio(): void {
  prefs = readAudioPrefs();
  if (typeof document === "undefined") return;
  const unlock = (): void => {
    void unlockAudio();
  };
  document.addEventListener("pointerdown", unlock, { capture: true, once: true });
  document.addEventListener("keydown", unlock, { capture: true, once: true });
  document.addEventListener("visibilitychange", () => {
    if (!bgmEl) return;
    if (document.hidden) {
      hiddenPaused = true;
      bgmEl.pause();
      void ctx?.suspend().catch(() => undefined);
    } else {
      void ctx?.resume().catch(() => undefined);
      if (hiddenPaused && currentBgm) {
        void playBgm(currentBgm);
      }
      hiddenPaused = false;
    }
  });
}

export async function playBgm(id: BgmId | null): Promise<void> {
  if (!id) {
    await stopBgm();
    return;
  }
  const el = ensureBgmEl();
  if (id === currentBgm) {
    el.volume = bgmElementVolume();
    if (el.paused && el.src) {
      try {
        await el.play();
      } catch {
        pendingBgm = id;
      }
    }
    return;
  }

  const gen = ++bgmGen;
  currentBgm = id;
  pendingBgm = id;
  stopBgmEl();

  const url = await firstExisting(bgmSrcCandidates(id));
  if (gen !== bgmGen) return;
  if (!url) return;

  el.loop = true;
  el.src = url;
  el.currentTime = 0;
  el.volume = bgmElementVolume();
  try {
    await el.play();
  } catch {
    if (gen === bgmGen) pendingBgm = id;
    return;
  }
  if (gen !== bgmGen) return;
  pendingBgm = null;
  applyGains();
}

export async function stopBgm(): Promise<void> {
  bgmGen += 1;
  currentBgm = null;
  pendingBgm = null;
  stopBgmEl();
}

export function duckBgm(on: boolean): void {
  ducking = on;
  applyGains();
}

export async function playSfx(
  id: SfxId | StingId,
  opts?: { gain?: number },
): Promise<void> {
  const audio = await ensureCtx();
  if (!audio || !sfxBus) return;
  const url = await firstExisting(sfxSrcCandidates(id));
  if (!url) return;
  const buf = await decodeSfx(url);
  if (!buf) return;
  try {
    const src = audio.createBufferSource();
    src.buffer = buf;
    const g = audio.createGain();
    const gain = opts?.gain ?? 1;
    g.gain.value = gain;
    src.connect(g);
    g.connect(sfxBus);
    src.start();
    const cap = sfxPlayCap(id);
    if (cap != null && buf.duration > cap) {
      const t = audio.currentTime;
      const fade = Math.min(0.04, cap * 0.25);
      g.gain.setValueAtTime(gain, t + Math.max(0, cap - fade));
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
