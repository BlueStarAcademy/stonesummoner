/**
 * Generate BGM/SFX via Stability AI / ElevenLabs, with local synth fallback.
 *
 * Incremental free-plan workflow (recommended):
 *   npm run audio:status          # how many tracks are still synth
 *   npm run audio:next            # replace the next synth track with API audio
 *
 * Other:
 *   node apps/web/scripts/gen-audio.mjs --only auth
 *   node apps/web/scripts/gen-audio.mjs --next --count 2
 *   node apps/web/scripts/gen-audio.mjs --synth
 *   node apps/web/scripts/gen-audio.mjs --force --only ui-tap
 *
 * Env: STABILITY_API_KEY, ELEVENLABS_API_KEY (optional)
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { synthTrackWav } from "./synth-audio.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const promptsPath = path.join(__dirname, "audio-prompts.json");
const publicAudio = path.join(webRoot, "public", "audio");
const tmpDir = path.join(webRoot, "public", "audio", "_tmp");
const manifestPath = path.join(publicAudio, "manifest.json");

const API_SOURCES = new Set(["stability", "elevenlabs"]);

/** Stable Audio is a music model — chrome clicks come out as 1s combat stings. */
const SYNTH_ONLY_IDS = new Set([
  "ui-tap",
  "ui-tab",
  "ui-confirm",
  "ui-cancel",
  "ui-disabled",
  "ui-modal-open",
  "ui-modal-close",
  "ui-toast",
  "ui-error",
]);

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(path.join(repoRoot, ".env"));
loadEnvFile(path.join(webRoot, ".env"));

const args = process.argv.slice(2);
function flagValue(name) {
  const withEq = args.find((a) => a.startsWith(`${name}=`));
  if (withEq) return withEq.slice(name.length + 1);
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1] && !args[i + 1].startsWith("-")) return args[i + 1];
  return null;
}

const onlyList = (flagValue("--only") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const force = args.includes("--force");
const synthOnly = args.includes("--synth");
const wantStatus = args.includes("--status");
const wantNext = args.includes("--next") || (!synthOnly && !onlyList.length && !force && !wantStatus && !args.includes("--all"));
const count = Math.max(1, Math.min(100, Number(flagValue("--count") ?? "1") || 1));

function hasFfmpeg() {
  const r = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return r.status === 0;
}

function folderFor(track) {
  return track.kind === "bgm" ? "bgm" : "sfx";
}

function destBase(track) {
  return path.join(publicAudio, folderFor(track), track.id);
}

function fileFlags(track) {
  const base = destBase(track);
  return {
    ogg: fs.existsSync(`${base}.ogg`),
    mp3: fs.existsSync(`${base}.mp3`),
    wav: fs.existsSync(`${base}.wav`),
  };
}

function hasAnyFile(track) {
  const f = fileFlags(track);
  return f.ogg || f.mp3 || f.wav;
}

function readManifest() {
  try {
    if (!fs.existsSync(manifestPath)) return { files: {} };
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return { files: {} };
  }
}

function writeManifest(manifest) {
  fs.mkdirSync(publicAudio, { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function sourceOf(manifest, track) {
  const entry = manifest.files?.[track.id];
  if (entry?.source && entry.source !== "skipped") return entry.source;
  if (hasAnyFile(track)) return "synth";
  return "missing";
}

function needsApi(manifest, track) {
  if (SYNTH_ONLY_IDS.has(track.id)) return false;
  return !API_SOURCES.has(sourceOf(manifest, track));
}

function apiForTrack(track) {
  if (track.kind === "bgm") return process.env.STABILITY_API_KEY ? "stability" : null;
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  if (process.env.STABILITY_API_KEY) return "stability";
  return null;
}

function creditError(status, body) {
  const text = `${status} ${body}`.toLowerCase();
  return (
    status === 402 ||
    status === 429 ||
    text.includes("credit") ||
    text.includes("quota") ||
    text.includes("insufficient") ||
    text.includes("payment") ||
    text.includes("limit")
  );
}

async function stabilityGenerate(track, wavOut) {
  const key = process.env.STABILITY_API_KEY;
  if (!key) return { ok: false, reason: "no-key" };
  const body = new FormData();
  body.set("prompt", `${track.prompt}. instrumental only, no vocals, no lyrics`);
  body.set("duration", String(Math.max(1, Math.min(190, Number(track.duration) || 8))));
  body.set("model", "stable-audio-2.5");
  const res = await fetch(
    "https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "audio/*",
      },
      body,
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      reason: creditError(res.status, text) ? "credits" : "api",
      detail: `${res.status} ${text.slice(0, 220)}`,
    };
  }
  fs.writeFileSync(wavOut, Buffer.from(await res.arrayBuffer()));
  return { ok: true };
}

async function elevenSfx(track, wavOut) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key || track.kind === "bgm") return { ok: false, reason: "no-key" };
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: {
      "xi-api-key": key,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: track.prompt,
      duration_seconds: Math.max(0.5, Math.min(22, Number(track.duration) || 1)),
      prompt_influence: 0.35,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      reason: creditError(res.status, text) ? "credits" : "api",
      detail: `${res.status} ${text.slice(0, 220)}`,
    };
  }
  fs.writeFileSync(wavOut, Buffer.from(await res.arrayBuffer()));
  return { ok: true };
}

function encode(src, track) {
  const base = destBase(track);
  const ogg = `${base}.ogg`;
  const mp3 = `${base}.mp3`;
  const wav = `${base}.wav`;
  const lufs = track.kind === "bgm" ? -16 : -18;
  if (!hasFfmpeg()) {
    fs.copyFileSync(src, wav);
    return { ogg: false, wav: true };
  }
  const dur = Number(track.duration) || (track.kind === "bgm" ? 80 : 0.4);
  const fade =
    track.kind === "bgm"
      ? `afade=t=in:st=0:d=0.04,afade=t=out:st=${Math.max(0, dur - 1.6)}:d=1.5`
      : `atrim=0:${dur},afade=t=out:st=${Math.max(0, dur - 0.05)}:d=0.05`;
  const af = `loudnorm=I=${lufs}:TP=-1.5:LRA=11,${fade}`;
  const oggR = spawnSync(
    "ffmpeg",
    ["-y", "-i", src, "-af", af, "-c:a", "libvorbis", "-q:a", "5", ogg],
    { encoding: "utf8" },
  );
  const mp3R = spawnSync(
    "ffmpeg",
    ["-y", "-i", src, "-af", af, "-c:a", "libmp3lame", "-b:a", "96k", mp3],
    { encoding: "utf8" },
  );
  if (oggR.status !== 0) {
    console.warn(`ffmpeg ogg ${track.id}: ${(oggR.stderr || "").slice(-200)}`);
    fs.copyFileSync(src, wav);
  }
  if (mp3R.status !== 0) {
    console.warn(`ffmpeg mp3 ${track.id}: ${(mp3R.stderr || "").slice(-200)}`);
  }
  return { ogg: oggR.status === 0, mp3: mp3R.status === 0, wav: fs.existsSync(wav) };
}

function printStatus(catalog, manifest) {
  const rows = catalog.tracks.map((t) => ({
    id: t.id,
    kind: t.kind,
    source: sourceOf(manifest, t),
  }));
  const api = rows.filter((r) => API_SOURCES.has(r.source)).length;
  const synth = rows.filter((r) => r.source === "synth").length;
  const missing = rows.filter((r) => r.source === "missing").length;
  const next = catalog.tracks.find((t) => needsApi(manifest, t) && apiForTrack(t));
  const blocked = catalog.tracks.find((t) => needsApi(manifest, t) && !apiForTrack(t));
  console.log(`audio progress  API ${api}/${rows.length}  synth ${synth}  missing ${missing}`);
  if (next) {
    console.log(`next upgrade    ${next.id}  (${next.kind}) via ${apiForTrack(next)}`);
    console.log(`run             npm run audio:next`);
  } else if (blocked) {
    console.log(`next pending    ${blocked.id}  (${blocked.kind}) — add the matching API key`);
  } else {
    console.log("all tracks have API audio");
  }
  const leftover = rows.filter((r) => !API_SOURCES.has(r.source)).slice(0, 8);
  if (leftover.length) {
    console.log(`still synth     ${leftover.map((r) => r.id).join(", ")}${rows.length - api > 8 ? " ..." : ""}`);
  }
}

async function generateOne(track, { allowSynth }) {
  fs.mkdirSync(path.join(publicAudio, folderFor(track)), { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmp = path.join(tmpDir, `${track.id}.bin`);
  let source = "synth";
  let lastFail = null;

  const useSynthOnly = synthOnly || SYNTH_ONLY_IDS.has(track.id);
  if (!useSynthOnly) {
    if (track.kind === "sfx" || track.kind === "sting") {
      const eleven = await elevenSfx(track, tmp);
      if (eleven.ok) source = "elevenlabs";
      else lastFail = eleven;
    }
    if (source === "synth") {
      const stab = await stabilityGenerate(track, tmp);
      if (stab.ok) source = "stability";
      else lastFail = lastFail?.reason === "credits" ? lastFail : stab;
    }
  }

  if (source === "synth") {
    if (!allowSynth) {
      return { ok: false, fail: lastFail ?? { reason: "no-key" } };
    }
    const tmpWav = path.join(tmpDir, `${track.id}.wav`);
    const local = {
      ...track,
      duration: track.kind === "bgm" ? Math.min(48, Number(track.duration) || 48) : track.duration,
    };
    synthTrackWav(local, tmpWav);
    fs.copyFileSync(tmpWav, tmp);
  }

  const encoded = encode(tmp, track);
  return { ok: true, source, encoded, fail: lastFail };
}

async function main() {
  const catalog = JSON.parse(fs.readFileSync(promptsPath, "utf8"));
  const manifest = readManifest();
  manifest.files ??= {};
  manifest.ffmpeg = hasFfmpeg();
  manifest.stability = Boolean(process.env.STABILITY_API_KEY);
  manifest.eleven = Boolean(process.env.ELEVENLABS_API_KEY);

  if (wantStatus) {
    printStatus(catalog, manifest);
    return;
  }

  if (wantNext && !synthOnly) {
    if (!process.env.STABILITY_API_KEY && !process.env.ELEVENLABS_API_KEY) {
      console.log("No API keys in .env yet. Add STABILITY_API_KEY and/or ELEVENLABS_API_KEY.");
      console.log("Until then the game already plays local synth beds. When credits refresh:");
      console.log("  npm run audio:next");
      printStatus(catalog, manifest);
      return;
    }

    const queue = catalog.tracks.filter((t) => needsApi(manifest, t) && apiForTrack(t));
    if (!queue.length) {
      printStatus(catalog, manifest);
      return;
    }

    let made = 0;
    for (const track of queue.slice(0, count)) {
      console.log(`upgrading ${track.id} (${track.kind}) ...`);
      const result = await generateOne(track, { allowSynth: false });
      if (!result.ok) {
        if (result.fail?.reason === "credits") {
          console.log(`Stopped: free credits/quota exhausted on ${track.id}.`);
          console.log(result.fail.detail ?? "");
          console.log("Run npm run audio:next again when the free plan refreshes.");
        } else {
          console.log(`API failed for ${track.id}: ${result.fail?.detail ?? result.fail?.reason}`);
          console.log("Existing synth file was kept.");
        }
        break;
      }
      manifest.files[track.id] = {
        source: result.source,
        upgradedAt: new Date().toISOString(),
        ...result.encoded,
      };
      manifest.generatedAt = new Date().toISOString();
      writeManifest(manifest);
      console.log(`${track.id} ← ${result.source}`);
      made += 1;
    }
    if (made) printStatus(catalog, manifest);
    return;
  }

  const tracks = catalog.tracks.filter((t) => !onlyList.length || onlyList.includes(t.id));
  for (const track of tracks) {
    if (!force && hasAnyFile(track) && !onlyList.length) {
      const src = sourceOf(manifest, track);
      manifest.files[track.id] = {
        ...(manifest.files[track.id] ?? {}),
        source: src === "missing" ? "synth" : src,
        ...fileFlags(track),
      };
      console.log(`skip ${track.id} (${sourceOf(manifest, track)})`);
      continue;
    }
    if (!force && hasAnyFile(track) && onlyList.length && API_SOURCES.has(sourceOf(manifest, track))) {
      console.log(`skip ${track.id} (already API)`);
      continue;
    }
    const result = await generateOne(track, { allowSynth: true });
    if (!result.ok) continue;
    manifest.files[track.id] = {
      source: result.source,
      upgradedAt: new Date().toISOString(),
      ...result.encoded,
    };
    console.log(`${track.id} ← ${result.source}`);
  }
  manifest.generatedAt = new Date().toISOString();
  writeManifest(manifest);
  console.log(`wrote ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
