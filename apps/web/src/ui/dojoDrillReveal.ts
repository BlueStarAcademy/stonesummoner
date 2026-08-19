import { t, type MessageKey } from "../i18n";
import { playSfx } from "../audio";

export const DOJO_DRILL_REVEAL_LAYER_ID = "dojo-drill-reveal-layer";
export const DOJO_DRILL_PLAY_MS = 3000;

const DOJO_DRILL_TITLE_KEYS = [
  "ui.dojo.drill.life",
  "ui.dojo.drill.capture",
  "ui.dojo.drill.atari",
  "ui.dojo.drill.movement",
  "ui.dojo.drill.joseki",
  "ui.dojo.drill.fuseki",
  "ui.dojo.drill.tesuji",
  "ui.dojo.drill.reading",
  "ui.dojo.drill.lifeDeath",
  "ui.dojo.drill.value",
  "ui.dojo.drill.endgame",
] as const satisfies readonly MessageKey[];

export function dojoDrillTitleAt(index: number): string {
  const n = DOJO_DRILL_TITLE_KEYS.length;
  const i = ((Math.floor(index) % n) + n) % n;
  return t(DOJO_DRILL_TITLE_KEYS[i]);
}

export type DojoDrillRevealPayload = {
  jinmunGain: number;
  title: string;
};

export type DojoDrillRevealHost = {
  mount: (layerId: string, html: string) => HTMLElement | null;
  remove: (layerId: string) => void;
};

type Phase = "playing" | "result";

type Live = {
  payload: DojoDrillRevealPayload;
  phase: Phase;
  host: DojoDrillRevealHost;
  onDismiss: () => void;
  startedAt: number;
  playMs: number;
  playTimer: number;
};

let live: Live | null = null;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPlaying(payload: DojoDrillRevealPayload): string {
  const title = escapeHtml(payload.title);
  return `<div class="settings-layer dojo-drill-reveal-layer" id="${DOJO_DRILL_REVEAL_LAYER_ID}" aria-hidden="false">
    <div class="settings-backdrop" aria-hidden="true"></div>
    <div class="growth-rite-play dojo-drill-play" role="dialog" aria-modal="true" aria-labelledby="dojo-drill-play-title">
      <div class="growth-rite-glow" aria-hidden="true"></div>
      <img class="growth-rite-circle" src="/art/hub/summon-circle.webp" width="320" height="320" alt="" draggable="false" onerror="this.onerror=null;this.src='/art/hub/summon-circle.svg'" />
      <div class="growth-rite-core">
        <img class="dojo-drill-stone" src="/art/ui/res/jinmun.svg" width="72" height="72" alt="" draggable="false" />
      </div>
      <p class="growth-rite-kicker" id="dojo-drill-play-title">${title}</p>
      <div class="growth-rite-meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="${title}">
        <span class="growth-rite-meter-fill"></span>
      </div>
    </div>
  </div>`;
}

function renderResult(payload: DojoDrillRevealPayload): string {
  const close = escapeHtml(t("ui.growthClose"));
  const title = escapeHtml(t("ui.dojo.resultTitle"));
  const gain = payload.jinmunGain;
  return `<div class="settings-layer dojo-drill-reveal-layer" id="${DOJO_DRILL_REVEAL_LAYER_ID}" aria-hidden="false">
    <button type="button" class="settings-backdrop" id="btn-dojo-drill-reveal-close" aria-label="${close}"></button>
    <div class="settings-sheet dojo-drill-result" role="dialog" aria-modal="true" aria-labelledby="dojo-drill-result-title">
      <button type="button" class="modal-x" data-modal-x-for="btn-dojo-drill-reveal-close" aria-label="${close}"></button>
      <h2 class="settings-title" id="dojo-drill-result-title">${title}</h2>
      <p class="dojo-drill-result-lead">${escapeHtml(t("ui.dojo.resultLead"))}</p>
      <div class="dojo-drill-gain" aria-label="${escapeHtml(t("res.jinmun"))}">
        <span class="res-cost-chip" title="${escapeHtml(t("res.jinmun"))}">
          <img class="res-ico" src="/art/ui/res/jinmun.svg" width="16" height="16" alt="" draggable="false" />
          <strong>+${gain}</strong>
        </span>
      </div>
      <button type="button" class="auth-btn-primary full" id="btn-dojo-drill-reveal-ok">${escapeHtml(t("ui.468266d639"))}</button>
    </div>
  </div>`;
}

function clearTimers(session: Live | null): void {
  if (!session) return;
  window.clearTimeout(session.playTimer);
  session.playTimer = 0;
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
  const html = live.phase === "playing" ? renderPlaying(live.payload) : renderResult(live.payload);
  const layer = live.host.mount(DOJO_DRILL_REVEAL_LAYER_ID, html);
  if (layer && live.phase === "playing") syncPlayMeter(layer, live);
  bindLayer(layer);
  return layer;
}

function showResult(): void {
  if (!live || live.phase === "result") return;
  clearTimers(live);
  live.phase = "result";
  void playSfx("ui-claim");
  paint();
}

function dismiss(): void {
  const session = live;
  live = null;
  if (!session) return;
  clearTimers(session);
  session.host.remove(DOJO_DRILL_REVEAL_LAYER_ID);
  session.onDismiss();
}

function bindLayer(layer: HTMLElement | null): void {
  if (!layer || !live) return;
  if (live.phase === "playing") return;
  const close = (): void => dismiss();
  layer.querySelector("#btn-dojo-drill-reveal-close")?.addEventListener("click", close);
  layer.querySelector("#btn-dojo-drill-reveal-ok")?.addEventListener("click", close);
}

export function abortDojoDrillReveal(): void {
  const session = live;
  live = null;
  if (!session) return;
  clearTimers(session);
  session.host.remove(DOJO_DRILL_REVEAL_LAYER_ID);
}

export function dojoDrillRevealIsOpen(): boolean {
  return live != null;
}

export function remountDojoDrillReveal(): void {
  if (!live) return;
  paint();
}

export function playDojoDrillReveal(
  payload: DojoDrillRevealPayload,
  host: DojoDrillRevealHost,
  onDismiss: () => void,
): void {
  abortDojoDrillReveal();
  const session: Live = {
    payload,
    phase: "playing",
    host,
    onDismiss,
    startedAt: Date.now(),
    playMs: DOJO_DRILL_PLAY_MS,
    playTimer: 0,
  };
  live = session;
  paint();
  session.playTimer = window.setTimeout(() => {
    if (live === session) showResult();
  }, session.playMs);
}
