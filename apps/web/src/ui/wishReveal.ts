import { t, type MessageKey } from "../i18n";
import type { WishReward, WishRewardKind } from "stonesummoner-home";

export const WISH_REVEAL_LAYER_ID = "wish-rite-layer";
export const WISH_ROULETTE_MS = 2800;
const SKIP_LOCK_MS = 400;
const CELL_H = 76;
const SPIN_CELLS = 22;

export type WishRevealHost = {
  mount: (layerId: string, html: string) => HTMLElement | null;
  remove: (layerId: string) => void;
  dematte?: (root: ParentNode) => void;
};

type Phase = "spinning" | "result";

type Live = {
  reward: WishReward;
  phase: Phase;
  host: WishRevealHost;
  onDismiss: () => void;
  skipLocked: boolean;
  playTimer: number;
  lockTimer: number;
  stopIndex: number;
};

let live: Live | null = null;

const CYCLE: WishRewardKind[] = ["mana", "crystal", "scroll"];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function wishRewardIconSrc(kind: WishRewardKind): string {
  if (kind === "mana") return "/art/ui/res/gold.svg";
  if (kind === "crystal") return "/art/ui/res/crystal.svg";
  return "/art/ui/res/scroll-normal.webp";
}

export function wishRewardNameKey(kind: WishRewardKind): MessageKey {
  if (kind === "mana") return "res.gold";
  if (kind === "crystal") return "res.crystal";
  return "res.scrollNormal";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true
  );
}

function clearTimers(session: Live): void {
  if (session.playTimer) window.clearTimeout(session.playTimer);
  if (session.lockTimer) window.clearTimeout(session.lockTimer);
  session.playTimer = 0;
  session.lockTimer = 0;
}

function buildTrack(reward: WishReward): { cellsHtml: string; stopIndex: number } {
  const stopIndex = SPIN_CELLS - 3;
  const cells: string[] = [];
  for (let i = 0; i < SPIN_CELLS; i++) {
    const winIdx = Math.max(0, CYCLE.indexOf(reward.kind));
    const kind = i === stopIndex ? reward.kind : CYCLE[(i + winIdx) % CYCLE.length]!;
    const isWin = i === stopIndex;
    const amount = isWin ? `+${reward.amount}` : "";
    cells.push(`<div class="wish-roulette-cell${isWin ? " is-winner" : ""}" data-kind="${kind}">
      <img src="${wishRewardIconSrc(kind)}" width="44" height="44" alt="" draggable="false" />
      <span class="wish-roulette-label">${escapeHtml(t(wishRewardNameKey(kind)))}</span>
      ${amount ? `<strong class="wish-roulette-amt">${amount}</strong>` : `<span class="wish-roulette-amt wish-roulette-amt--ghost" aria-hidden="true">·</span>`}
    </div>`);
  }
  return { cellsHtml: cells.join(""), stopIndex };
}

function renderSpinning(reward: WishReward, stopIndex: number, cellsHtml: string): string {
  const close = escapeHtml(t("ui.wishClose"));
  const title = escapeHtml(t("ui.wishSpinning"));
  const reduced = prefersReducedMotion();
  const y = -(stopIndex * CELL_H);
  const duration = reduced ? 0 : WISH_ROULETTE_MS;
  return `<div class="settings-layer wish-rite-layer" id="${WISH_REVEAL_LAYER_ID}" aria-hidden="false">
    <button type="button" class="settings-backdrop" id="btn-wish-rite-skip" aria-label="${close}"></button>
    <div class="wish-rite-play" role="dialog" aria-modal="true" aria-labelledby="wish-rite-title">
      <p class="wish-rite-kicker" id="wish-rite-title">${title}</p>
      <div class="wish-roulette" aria-live="polite">
        <div class="wish-roulette-window">
          <div class="wish-roulette-track" id="wish-roulette-track" style="--wish-stop-y:${y}px;--wish-spin-ms:${duration}ms">${cellsHtml}</div>
        </div>
        <div class="wish-roulette-pointer" aria-hidden="true"></div>
      </div>
      <p class="wish-rite-hint">${escapeHtml(t("ui.wishSkipHint"))}</p>
    </div>
  </div>`;
}

function renderResult(reward: WishReward): string {
  const close = escapeHtml(t("ui.wishClose"));
  const title = escapeHtml(t("ui.wishResultTitle"));
  const name = escapeHtml(t(wishRewardNameKey(reward.kind)));
  const gain = escapeHtml(t("ui.wishResultGain", { name: t(wishRewardNameKey(reward.kind)), amount: reward.amount }));
  return `<div class="settings-layer wish-rite-layer" id="${WISH_REVEAL_LAYER_ID}" aria-hidden="false">
    <button type="button" class="settings-backdrop" id="btn-wish-rite-close" aria-label="${close}"></button>
    <div class="settings-sheet wish-result-sheet" role="dialog" aria-modal="true" aria-labelledby="wish-result-title">
      <button type="button" class="modal-x" data-modal-x-for="btn-wish-rite-close" aria-label="${close}"></button>
      <h2 class="settings-title" id="wish-result-title">${title}</h2>
      <div class="wish-result-hero">
        <img class="wish-result-ico" src="${wishRewardIconSrc(reward.kind)}" width="72" height="72" alt="" draggable="false" />
        <strong>${name}</strong>
        <p class="wish-result-gain">${gain}</p>
      </div>
      <button type="button" class="auth-btn-primary full" id="btn-wish-rite-ok">${escapeHtml(t("ui.468266d639"))}</button>
    </div>
  </div>`;
}

function paint(): void {
  if (!live) return;
  let html: string;
  if (live.phase === "spinning") {
    const track = buildTrack(live.reward);
    live.stopIndex = track.stopIndex;
    html = renderSpinning(live.reward, track.stopIndex, track.cellsHtml);
  } else {
    html = renderResult(live.reward);
  }
  const layer = live.host.mount(WISH_REVEAL_LAYER_ID, html);
  if (layer && live.host.dematte) live.host.dematte(layer);
  if (live.phase === "spinning" && layer) {
    const trackEl = layer.querySelector<HTMLElement>("#wish-roulette-track");
    if (trackEl) {
      // Force layout so the CSS transition runs from translateY(0).
      void trackEl.offsetWidth;
      trackEl.classList.add("is-spinning");
    }
  }
  bindLayer(layer);
}

function showResult(): void {
  if (!live || live.phase === "result") return;
  live.phase = "result";
  clearTimers(live);
  paint();
}

function dismiss(): void {
  const session = live;
  live = null;
  if (!session) return;
  clearTimers(session);
  session.host.remove(WISH_REVEAL_LAYER_ID);
  session.onDismiss();
}

function bindLayer(layer: HTMLElement | null): void {
  if (!layer || !live) return;
  if (live.phase === "spinning") {
    const skip = (): void => {
      if (!live || live.skipLocked) return;
      showResult();
    };
    layer.querySelector("#btn-wish-rite-skip")?.addEventListener("click", skip);
    layer.querySelector(".wish-rite-play")?.addEventListener("click", skip);
    return;
  }
  const close = (): void => dismiss();
  layer.querySelector("#btn-wish-rite-close")?.addEventListener("click", close);
  layer.querySelector("#btn-wish-rite-ok")?.addEventListener("click", close);
}

export function abortWishReveal(): void {
  const session = live;
  live = null;
  if (!session) return;
  clearTimers(session);
  session.host.remove(WISH_REVEAL_LAYER_ID);
}

export function wishRevealIsOpen(): boolean {
  return live != null;
}

export function remountWishReveal(): void {
  if (!live) return;
  paint();
}

export function playWishReveal(
  reward: WishReward,
  host: WishRevealHost,
  onDismiss: () => void,
): void {
  abortWishReveal();
  const reduced = prefersReducedMotion();
  const session: Live = {
    reward,
    phase: "spinning",
    host,
    onDismiss,
    skipLocked: !reduced,
    playTimer: 0,
    lockTimer: 0,
    stopIndex: 0,
  };
  live = session;
  paint();
  if (reduced) {
    session.skipLocked = false;
    showResult();
    return;
  }
  session.lockTimer = window.setTimeout(() => {
    if (live === session) session.skipLocked = false;
  }, SKIP_LOCK_MS);
  session.playTimer = window.setTimeout(() => {
    if (live === session) showResult();
  }, WISH_ROULETTE_MS);
}
