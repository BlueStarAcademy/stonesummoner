/**
 * Local cinematic synth fallback when Stability / ElevenLabs keys are absent.
 * Writes 16-bit stereo WAV. Not a live orchestra — layered pads, arp, percussion.
 */
import fs from "node:fs";

const SR = 44100;

function hash32(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    return a / 4294967296;
  };
}

function midiToHz(m) {
  return 440 * 2 ** ((m - 69) / 12);
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function envADSR(t, dur, a, d, s, r) {
  if (t < 0 || t > dur) return 0;
  if (t < a) return t / Math.max(a, 1e-4);
  if (t < a + d) return 1 - (1 - s) * ((t - a) / Math.max(d, 1e-4));
  if (t > dur - r) return s * (1 - (t - (dur - r)) / Math.max(r, 1e-4));
  return s;
}

function sine(hz, t, ph = 0) {
  return Math.sin(2 * Math.PI * hz * t + ph);
}

function tri(hz, t, ph = 0) {
  const x = (hz * t + ph / (2 * Math.PI)) % 1;
  return 1 - 4 * Math.abs(x - 0.5);
}

function noise(rand) {
  return rand() * 2 - 1;
}

function onePole(prev, x, alpha) {
  return prev + alpha * (x - prev);
}

function writeWav(path, L, R) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const ls = clamp(L[i], -1, 1);
    const rs = clamp(R[i], -1, 1);
    buf.writeInt16LE((ls * 32767) | 0, 44 + i * 4);
    buf.writeInt16LE((rs * 32767) | 0, 46 + i * 4);
  }
  fs.writeFileSync(path, buf);
}

const MODES = {
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  major: [0, 2, 4, 5, 7, 9, 11],
};

/** Per-track orchestration. */
const BGM_SPEC = {
  auth: { bpm: 72, root: 62, mode: "minor", bright: 0.35, drums: 0.18, gold: 1 },
  island: { bpm: 88, root: 67, mode: "major", bright: 0.7, drums: 0.12, gold: 0.8 },
  stages: { bpm: 96, root: 57, mode: "minor", bright: 0.55, drums: 0.35, gold: 0.5 },
  "combat-map-01": { bpm: 100, root: 62, mode: "dorian", bright: 0.45, drums: 0.4, gold: 0.3 },
  "combat-map-02": { bpm: 104, root: 60, mode: "minor", bright: 0.4, drums: 0.55, gold: 0.25 },
  "combat-map-03": { bpm: 98, root: 66, mode: "phrygian", bright: 0.3, drums: 0.35, gold: 0.2 },
  "combat-map-04": { bpm: 92, root: 64, mode: "minor", bright: 0.25, drums: 0.22, gold: 0.15 },
  "combat-map-05": { bpm: 112, root: 55, mode: "minor", bright: 0.35, drums: 0.7, gold: 0.15 },
  "combat-map-06": { bpm: 90, root: 59, mode: "minor", bright: 0.55, drums: 0.28, gold: 0.4 },
  "combat-map-07": { bpm: 108, root: 62, mode: "minor", bright: 0.4, drums: 0.72, gold: 0.2 },
  "combat-map-08": { bpm: 94, root: 61, mode: "phrygian", bright: 0.2, drums: 0.4, gold: 0.1 },
  "combat-map-09": { bpm: 100, root: 57, mode: "minor", bright: 0.28, drums: 0.48, gold: 0.15 },
  "combat-map-10": { bpm: 102, root: 65, mode: "mixolydian", bright: 0.65, drums: 0.42, gold: 0.55 },
  "combat-map-11": { bpm: 98, root: 64, mode: "dorian", bright: 0.7, drums: 0.3, gold: 0.5 },
  "combat-map-12": { bpm: 96, root: 56, mode: "phrygian", bright: 0.18, drums: 0.45, gold: 0.08 },
  "combat-map-13": { bpm: 90, root: 50, mode: "minor", bright: 0.22, drums: 0.62, gold: 0.25 },
  "combat-cairos-giant": { bpm: 100, root: 48, mode: "minor", bright: 0.25, drums: 0.75, gold: 0.1 },
  "combat-cairos-dragon": { bpm: 108, root: 53, mode: "minor", bright: 0.4, drums: 0.8, gold: 0.2 },
  "combat-cairos-necro": { bpm: 88, root: 47, mode: "phrygian", bright: 0.15, drums: 0.4, gold: 0.05 },
  "combat-arena": { bpm: 116, root: 57, mode: "minor", bright: 0.5, drums: 0.85, gold: 0.35 },
  "combat-weekday": { bpm: 104, root: 64, mode: "dorian", bright: 0.6, drums: 0.4, gold: 0.45 },
  "combat-equip": { bpm: 100, root: 62, mode: "mixolydian", bright: 0.62, drums: 0.38, gold: 0.7 },
  "combat-depth": { bpm: 92, root: 53, mode: "minor", bright: 0.2, drums: 0.5, gold: 0.1 },
};

const PROG = [0, 5, 7, 5];

function chordTones(root, modeName, degree) {
  const mode = MODES[modeName] ?? MODES.minor;
  const i = ((degree % 7) + 7) % 7;
  return [0, 2, 4].map((step) => root + mode[(i + step) % 7] + 12 * Math.floor((i + step) / 7));
}

export function synthBgmWav(id, durationSec, outPath) {
  const spec = BGM_SPEC[id] ?? {
    bpm: 96,
    root: 60,
    mode: "minor",
    bright: 0.4,
    drums: 0.4,
    gold: 0.3,
  };
  const n = Math.floor(durationSec * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const rand = rng(hash32(id));
  const beat = 60 / spec.bpm;
  const bar = beat * 4;
  let lpL = 0;
  let lpR = 0;
  let nL = 0;
  let nR = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const barI = Math.floor(t / bar);
    const degree = PROG[barI % PROG.length];
    const chord = chordTones(spec.root, spec.mode, degree);
    const beatI = Math.floor(t / beat);
    const beatPos = (t % beat) / beat;
    const barPos = (t % bar) / bar;

    let sl = 0;
    let sr = 0;

    for (let c = 0; c < chord.length; c++) {
      const hz = midiToHz(chord[c] - 12);
      const hz2 = midiToHz(chord[c]);
      const pad =
        0.22 * sine(hz, t, c) +
        0.12 * sine(hz * 2.002, t, c + 0.2) +
        0.08 * tri(hz2, t, c * 0.3) * spec.bright;
      sl += pad * (1 + 0.04 * c);
      sr += pad * (1 - 0.04 * c);
    }

    const arpIdx = Math.floor((t / (beat / 2)) % 4);
    const arpNote = chord[arpIdx % chord.length] + (arpIdx === 3 ? 12 : 0);
    const arpEnv = envADSR(t % (beat / 2), beat / 2, 0.01, 0.05, 0.2, 0.08);
    const arp = 0.11 * sine(midiToHz(arpNote + 12), t) * arpEnv * (0.5 + spec.bright);
    sl += arp * 1.05;
    sr += arp * 0.95;

    const bassHz = midiToHz(chord[0] - 24);
    const bass = 0.2 * sine(bassHz, t) * (0.7 + 0.3 * Math.sin(2 * Math.PI * barPos));
    sl += bass;
    sr += bass;

    if (spec.gold > 0.2 && beatI % 8 === 0) {
      const bell = envADSR(beatPos * beat, 0.9, 0.002, 0.12, 0.15, 0.5);
      const bh = midiToHz(chord[2] + 24);
      sl += 0.07 * spec.gold * sine(bh, t) * bell;
      sr += 0.07 * spec.gold * sine(bh * 1.003, t) * bell;
    }

    const kick =
      spec.drums *
      0.28 *
      envADSR(beatPos * beat, beat * 0.45, 0.001, 0.06, 0.05, 0.12) *
      sine(55 + 40 * Math.exp(-beatPos * 18), t);
    const hat =
      spec.drums *
      0.07 *
      envADSR((t % (beat / 2)) * 1, beat / 2, 0.001, 0.02, 0.02, 0.04) *
      (rand() * 2 - 1);
    sl += kick + hat * 0.7;
    sr += kick + hat * 1.1;

    nL = onePole(nL, (rand() * 2 - 1) * 0.04, 0.02);
    nR = onePole(nR, (rand() * 2 - 1) * 0.04, 0.02);
    sl += nL * (0.6 - spec.bright * 0.2);
    sr += nR * (0.6 - spec.bright * 0.2);

    const fadeIn = Math.min(1, t / 1.6);
    const fadeOut = Math.min(1, (durationSec - t) / 1.6);
    const g = fadeIn * fadeOut;
    lpL = onePole(lpL, sl, 0.35 + spec.bright * 0.2);
    lpR = onePole(lpR, sr, 0.35 + spec.bright * 0.2);
    L[i] = lpL * 0.55 * g;
    R[i] = lpR * 0.55 * g;
  }
  writeWav(outPath, L, R);
}

function burst(L, R, t0, dur, fn) {
  const i0 = Math.floor(t0 * SR);
  const n = Math.floor(dur * SR);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const v = fn(t, t / dur);
    const idx = i0 + i;
    if (idx >= 0 && idx < L.length) {
      L[idx] += v.l;
      R[idx] += v.r;
    }
  }
}

export function synthSfxWav(id, durationSec, outPath) {
  const n = Math.max(64, Math.floor(durationSec * SR));
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const rand = rng(hash32(id));
  const dur = n / SR;

  const click = (bright) => {
    burst(L, R, 0, Math.min(0.12, dur), (t, k) => {
      const e = Math.exp(-k * 28);
      const v = e * (sine(1800 + bright * 1200, t) * 0.35 + (rand() * 2 - 1) * 0.08);
      return { l: v, r: v * 0.92 };
    });
  };

  const whoosh = (up) => {
    burst(L, R, 0, dur, (t, k) => {
      const e = envADSR(t, dur, 0.02, 0.12, 0.4, 0.2);
      const hz = up ? 200 + k * 1400 : 1600 - k * 1200;
      const v = e * ((rand() * 2 - 1) * 0.35 + 0.08 * sine(hz, t));
      return { l: v * 0.9, r: v };
    });
  };

  const impact = (hz, noiseAmt) => {
    burst(L, R, 0, dur, (t, k) => {
      const e = Math.exp(-k * 10);
      const v =
        e * (0.45 * sine(hz * (1 - k * 0.3), t) + noiseAmt * (rand() * 2 - 1) * Math.exp(-k * 18));
      return { l: v, r: v * 0.95 };
    });
  };

  const magic = (hz) => {
    burst(L, R, 0, dur, (t, k) => {
      const e = envADSR(t, dur, 0.02, 0.1, 0.35, 0.25);
      const v =
        e *
        (0.28 * sine(hz, t) +
          0.16 * sine(hz * 1.5, t) +
          0.1 * sine(hz * 2.02, t) +
          0.08 * (rand() * 2 - 1) * Math.exp(-k * 8));
      return { l: v * 1.05, r: v * 0.95 };
    });
  };

  if (id === "ui-tap" || id === "ui-tab") click(0.6);
  else if (id === "ui-confirm" || id === "ui-toast" || id === "mana-ready") {
    burst(L, R, 0, dur, (t, k) => {
      const e = Math.exp(-k * 6);
      const v = e * 0.28 * (sine(880, t) + 0.6 * sine(1320, t));
      return { l: v, r: v };
    });
  } else if (id === "ui-cancel" || id === "ui-disabled" || id === "ui-error") {
    burst(L, R, 0, dur, (t, k) => {
      const e = Math.exp(-k * 10);
      const v = e * 0.3 * sine(180 - k * 40, t);
      return { l: v, r: v };
    });
  } else if (id === "ui-modal-open" || id === "stone-place" || id === "lunge" || id === "ult-cutin")
    whoosh(true);
  else if (id === "ui-modal-close" || id === "kind-board-clean") whoosh(false);
  else if (id.startsWith("atk-fire") || id === "hit-fire") impact(90, 0.45);
  else if (id.startsWith("atk-water") || id === "hit-water") magic(420);
  else if (id.startsWith("atk-wind") || id === "hit-wind") whoosh(true);
  else if (id.startsWith("atk-light") || id === "hit-holy" || id === "kind-heal" || id === "kind-buff")
    magic(740);
  else if (id.startsWith("atk-dark") || id === "hit-dark" || id === "kind-debuff") impact(70, 0.35);
  else if (id === "hit-crit") impact(140, 0.55);
  else if (id === "hit-med" || id === "hit-soft") impact(160, 0.25);
  else if (id === "ko") impact(55, 0.4);
  else if (id === "stone-drop") click(0.2);
  else if (id === "capture" || id === "amplify" || id === "kind-amplify") magic(520);
  else if (id === "board-reset") {
    whoosh(false);
    burst(L, R, dur * 0.45, dur * 0.55, (t, k) => {
      const e = envADSR(t, dur * 0.55, 0.02, 0.1, 0.4, 0.2);
      const v = e * 0.25 * sine(392, t);
      return { l: v, r: v };
    });
  } else if (id.startsWith("sting-victory") || id === "wave-clear" || id === "summon-reveal-rare") {
    burst(L, R, 0, dur, (t, k) => {
      const e = envADSR(t, dur, 0.01, 0.15, 0.45, 0.35);
      const v =
        e *
        (0.22 * sine(midiToHz(67), t) +
          0.18 * sine(midiToHz(71), t) +
          0.16 * sine(midiToHz(74), t) +
          0.12 * sine(midiToHz(79), t));
      return { l: v, r: v * 0.96 };
    });
  } else if (id === "sting-defeat") {
    burst(L, R, 0, dur, (t, k) => {
      const e = envADSR(t, dur, 0.02, 0.2, 0.4, 0.4);
      const v = e * (0.25 * sine(midiToHz(62), t) + 0.2 * sine(midiToHz(58), t));
      return { l: v, r: v };
    });
  } else if (id === "sting-boss") impact(48, 0.5);
  else if (
    id === "ui-claim" ||
    id === "ui-purchase" ||
    id === "ui-collect" ||
    id === "ui-unlock" ||
    id === "summon-pull" ||
    id === "summon-reveal" ||
    id === "wish-reveal" ||
    id === "fusion-cast" ||
    id === "forge-reveal" ||
    id === "enhance-tick" ||
    id === "kind-shield" ||
    id === "kind-aoe" ||
    id === "kind-single" ||
    id === "kind-dual-stone"
  ) {
    magic(id.includes("dark") ? 180 : 560);
    if (id.includes("aoe") || id === "summon-pull") impact(80, 0.25);
  } else {
    click(0.4);
  }

  let peak = 1e-6;
  for (let i = 0; i < n; i++) {
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  const g = 0.85 / peak;
  for (let i = 0; i < n; i++) {
    L[i] *= g;
    R[i] *= g;
  }
  writeWav(outPath, L, R);
}

export function synthTrackWav(track, outPath) {
  const dur = Number(track.duration) || (track.kind === "bgm" ? 48 : 0.4);
  if (track.kind === "bgm") synthBgmWav(track.id, Math.min(dur, 48), outPath);
  else synthSfxWav(track.id, dur, outPath);
}
