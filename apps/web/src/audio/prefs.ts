const STORAGE_KEY = "stonesummoner.audio.prefs.v1";

export type AudioPrefs = {
  master: number;
  bgm: number;
  sfx: number;
  muted: boolean;
  bgmMuted: boolean;
  sfxMuted: boolean;
};

const DEFAULTS: AudioPrefs = {
  master: 0.8,
  bgm: 0.72,
  sfx: 0.85,
  muted: false,
  bgmMuted: false,
  sfxMuted: false,
};

function clamp01(n: number): number {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}

export function defaultAudioPrefs(): AudioPrefs {
  return { ...DEFAULTS };
}

export function readAudioPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAudioPrefs();
    const parsed = JSON.parse(raw) as Partial<AudioPrefs>;
    return {
      master: clamp01(parsed.master ?? DEFAULTS.master),
      bgm: clamp01(parsed.bgm ?? DEFAULTS.bgm),
      sfx: clamp01(parsed.sfx ?? DEFAULTS.sfx),
      muted: Boolean(parsed.muted),
      bgmMuted: Boolean(parsed.bgmMuted),
      sfxMuted: Boolean(parsed.sfxMuted),
    };
  } catch {
    return defaultAudioPrefs();
  }
}

export function writeAudioPrefs(next: AudioPrefs): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        master: clamp01(next.master),
        bgm: clamp01(next.bgm),
        sfx: clamp01(next.sfx),
        muted: Boolean(next.muted),
        bgmMuted: Boolean(next.bgmMuted),
        sfxMuted: Boolean(next.sfxMuted),
      }),
    );
  } catch {
    /* private mode */
  }
}
