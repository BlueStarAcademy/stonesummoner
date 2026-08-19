import { t, type MessageKey } from "../i18n";
import { ARROW_RIGHT, EM_DASH } from "./marks";

export const GROWTH_REVEAL_LAYER_ID = "growth-reveal-layer";
export const GROWTH_REVEAL_PLAY_MS = 3000;
const SKIP_LOCK_MS = 400;

export type GrowthRevealKind =
  | "skillFeed"
  | "powerUp"
  | "evolve"
  | "awaken"
  | "fusion"
  | "magic"
  | "gear";

export type GrowthStatDelta = {
  id: string;
  label: string;
  from: number;
  to: number;
  percent?: boolean;
};

export type GrowthSkillDelta = {
  name: string;
  iconHtml: string;
  from: number;
  to: number;
  effect: string;
};

export type GrowthRevealPayload = {
  kind: GrowthRevealKind;
  portraitHtml: string;
  name: string;
  heroLine?: string;
  stats: GrowthStatDelta[];
  skills: GrowthSkillDelta[];
  notes: string[];
};

export type GrowthRevealHost = {
  mount: (layerId: string, html: string) => HTMLElement | null;
  remove: (layerId: string) => void;
  dematte?: (root: HTMLElement) => void;
};

type Phase = "playing" | "result";

type Live = {
  payload: GrowthRevealPayload;
  phase: Phase;
  host: GrowthRevealHost;
  onDismiss: () => void;
  skipLocked: boolean;
  startedAt: number;
  playMs: number;
  playTimer: number;
  lockTimer: number;
};

let live: Live | null = null;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function playingKey(kind: GrowthRevealKind): MessageKey {
  switch (kind) {
    case "skillFeed":
      return "ui.growthPlayingSkill";
    case "powerUp":
      return "ui.growthPlayingPowerUp";
    case "evolve":
      return "ui.growthPlayingEvolve";
    case "awaken":
      return "ui.growthPlayingAwaken";
    case "fusion":
      return "ui.growthPlayingFusion";
    case "magic":
      return "ui.growthPlayingMagic";
    case "gear":
      return "ui.growthPlayingGear";
  }
}

function resultKey(kind: GrowthRevealKind): MessageKey {
  switch (kind) {
    case "skillFeed":
      return "ui.growthResultSkill";
    case "powerUp":
      return "ui.growthResultPowerUp";
    case "evolve":
      return "ui.growthResultEvolve";
    case "awaken":
      return "ui.growthResultAwaken";
    case "fusion":
      return "ui.growthResultFusion";
    case "magic":
      return "ui.growthResultMagic";
    case "gear":
      return "ui.growthResultGear";
  }
}

function formatStat(n: number, percent?: boolean): string {
  return percent ? `${n}%` : String(n);
}

function renderStatRows(stats: GrowthStatDelta[]): string {
  if (!stats.length) return "";
  const rows = stats
    .map((row) => {
      const delta = row.to - row.from;
      const deltaCls = delta > 0 ? "is-up" : delta < 0 ? "is-down" : "is-flat";
      const deltaText =
        delta === 0 ? EM_DASH : `${delta > 0 ? "+" : ""}${delta}${row.percent ? "%" : ""}`;
      return `<div class="growth-stat-row" data-stat="${escapeHtml(row.id)}">
        <span class="growth-stat-k">${escapeHtml(row.label)}</span>
        <span class="growth-stat-v">${formatStat(row.from, row.percent)}<span class="growth-stat-arrow" aria-hidden="true">${ARROW_RIGHT}</span>${formatStat(row.to, row.percent)}</span>
        <span class="growth-stat-d ${deltaCls}">${deltaText}</span>
      </div>`;
    })
    .join("");
  return `<section class="growth-result-block" aria-label="${escapeHtml(t("ui.growthStatTitle"))}">
    <p class="growth-result-block-title">${escapeHtml(t("ui.growthStatTitle"))}</p>
    ${rows}
  </section>`;
}

function renderSkillRows(skills: GrowthSkillDelta[]): string {
  if (!skills.length) return "";
  const rows = skills
    .map(
      (skill) => `<div class="growth-skill-row">
        <span class="growth-skill-ico" aria-hidden="true">${skill.iconHtml}</span>
        <div class="growth-skill-meta">
          <strong>${escapeHtml(skill.name)}</strong>
          <span>Lv.${skill.from} ${ARROW_RIGHT} Lv.${skill.to}</span>
          <small>${escapeHtml(skill.effect)}</small>
        </div>
      </div>`,
    )
    .join("");
  return `<section class="growth-result-block" aria-label="${escapeHtml(t("ui.growthSkillTitle"))}">
    <p class="growth-result-block-title">${escapeHtml(t("ui.growthSkillTitle"))}</p>
    ${rows}
  </section>`;
}

function renderNotes(notes: string[]): string {
  if (!notes.length) return "";
  return `<section class="growth-result-block" aria-label="${escapeHtml(t("ui.growthNotesTitle"))}">
    <p class="growth-result-block-title">${escapeHtml(t("ui.growthNotesTitle"))}</p>
    <ul class="growth-result-notes">${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
  </section>`;
}

function renderPlaying(payload: GrowthRevealPayload): string {
  const close = escapeHtml(t("ui.growthClose"));
  const title = escapeHtml(t(playingKey(payload.kind)));
  return `<div class="settings-layer growth-reveal-layer" id="${GROWTH_REVEAL_LAYER_ID}" aria-hidden="false">
    <button type="button" class="settings-backdrop" id="btn-growth-reveal-skip" aria-label="${close}"></button>
    <div class="growth-rite-play growth-rite-play--${payload.kind}" role="dialog" aria-modal="true" aria-labelledby="growth-rite-title">
      <div class="growth-rite-glow" aria-hidden="true"></div>
      <img class="growth-rite-circle" src="/art/hub/summon-circle.webp" width="320" height="320" alt="" draggable="false" onerror="this.onerror=null;this.src='/art/hub/summon-circle.svg'" />
      <div class="growth-rite-core">${payload.portraitHtml}</div>
      <p class="growth-rite-kicker" id="growth-rite-title">${title}</p>
      <p class="growth-rite-name">${escapeHtml(payload.name)}</p>
      <div class="growth-rite-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${title}">
        <span class="growth-rite-meter-fill"></span>
      </div>
      <p class="growth-rite-hint">${escapeHtml(t("ui.growthSkipHint"))}</p>
    </div>
  </div>`;
}

function renderResult(payload: GrowthRevealPayload): string {
  const close = escapeHtml(t("ui.growthClose"));
  const title = escapeHtml(t(resultKey(payload.kind)));
  const hero = payload.heroLine
    ? `<p class="growth-result-hero-line">${escapeHtml(payload.heroLine)}</p>`
    : "";
  return `<div class="settings-layer growth-reveal-layer" id="${GROWTH_REVEAL_LAYER_ID}" aria-hidden="false">
    <button type="button" class="settings-backdrop" id="btn-growth-reveal-close" aria-label="${close}"></button>
    <div class="settings-sheet growth-result-sheet" role="dialog" aria-modal="true" aria-labelledby="growth-result-title">
      <button type="button" class="modal-x" data-modal-x-for="btn-growth-reveal-close" aria-label="${close}"></button>
      <h2 class="settings-title" id="growth-result-title">${title}</h2>
      <div class="growth-result-hero">
        <div class="growth-result-art" aria-hidden="true">${payload.portraitHtml}</div>
        <div class="growth-result-hero-meta">
          <strong>${escapeHtml(payload.name)}</strong>
          ${hero}
        </div>
      </div>
      ${renderStatRows(payload.stats)}
      ${renderSkillRows(payload.skills)}
      ${renderNotes(payload.notes)}
      <button type="button" class="auth-btn-primary full" id="btn-growth-reveal-ok">${escapeHtml(t("ui.468266d639"))}</button>
    </div>
  </div>`;
}

function renderLayer(payload: GrowthRevealPayload, phase: Phase): string {
  return phase === "playing" ? renderPlaying(payload) : renderResult(payload);
}

function clearTimers(session: Live | null): void {
  if (!session) return;
  window.clearTimeout(session.playTimer);
  window.clearTimeout(session.lockTimer);
  session.playTimer = 0;
  session.lockTimer = 0;
}

function syncPlayMeter(layer: HTMLElement, session: Live): void {
  const fill = layer.querySelector<HTMLElement>(".growth-rite-meter-fill");
  const meter = layer.querySelector<HTMLElement>(".growth-rite-meter");
  if (!fill || !meter || session.phase !== "playing") return;
  const elapsed = Math.max(0, Date.now() - session.startedAt);
  const pct = Math.max(0, Math.min(100, Math.round((elapsed / session.playMs) * 100)));
  meter.setAttribute("aria-valuenow", String(pct));
  fill.style.animation = "none";
  void fill.offsetWidth;
  fill.style.animation = `growth-rite-meter-fill ${session.playMs}ms linear ${-Math.min(elapsed, session.playMs)}ms forwards`;
}

function paint(): HTMLElement | null {
  if (!live) return null;
  const layer = live.host.mount(GROWTH_REVEAL_LAYER_ID, renderLayer(live.payload, live.phase));
  if (layer) {
    live.host.dematte?.(layer);
    if (live.phase === "playing") syncPlayMeter(layer, live);
  }
  bindLayer(layer);
  return layer;
}

function showResult(): void {
  if (!live || live.phase === "result") return;
  clearTimers(live);
  live.phase = "result";
  live.skipLocked = false;
  paint();
}

function dismiss(): void {
  const session = live;
  live = null;
  if (!session) return;
  clearTimers(session);
  session.host.remove(GROWTH_REVEAL_LAYER_ID);
  session.onDismiss();
}

function bindLayer(layer: HTMLElement | null): void {
  if (!layer || !live) return;
  if (live.phase === "playing") {
    const skip = (): void => {
      if (!live || live.skipLocked) return;
      showResult();
    };
    layer.querySelector("#btn-growth-reveal-skip")?.addEventListener("click", skip);
    layer.querySelector(".growth-rite-play")?.addEventListener("click", skip);
    return;
  }
  const close = (): void => dismiss();
  layer.querySelector("#btn-growth-reveal-close")?.addEventListener("click", close);
  layer.querySelector("#btn-growth-reveal-ok")?.addEventListener("click", close);
}

export function abortGrowthReveal(): void {
  const session = live;
  live = null;
  if (!session) return;
  clearTimers(session);
  session.host.remove(GROWTH_REVEAL_LAYER_ID);
}

export function growthRevealIsOpen(): boolean {
  return live != null;
}

export function remountGrowthReveal(): void {
  if (!live) return;
  paint();
}

export function playGrowthReveal(
  payload: GrowthRevealPayload,
  host: GrowthRevealHost,
  onDismiss: () => void,
): void {
  abortGrowthReveal();
  const session: Live = {
    payload,
    phase: "playing",
    host,
    onDismiss,
    skipLocked: true,
    startedAt: Date.now(),
    playMs: GROWTH_REVEAL_PLAY_MS,
    playTimer: 0,
    lockTimer: 0,
  };
  live = session;
  paint();
  session.lockTimer = window.setTimeout(() => {
    if (live === session) session.skipLocked = false;
  }, SKIP_LOCK_MS);
  session.playTimer = window.setTimeout(() => {
    if (live === session) showResult();
  }, session.playMs);
}
