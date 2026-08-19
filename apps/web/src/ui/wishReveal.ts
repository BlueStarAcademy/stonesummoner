import { formatNumber, t } from "../i18n";
import {
  WISH_REWARD_POOL,
  type WishPoolEntry,
  type WishReward,
  type WishRewardKind,
} from "stonesummoner-home";

export const WISH_REVEAL_LAYER_ID = "wish-rite-layer";

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
  hop: number;
  hops: number[];
  playTimer: number;
  lockTimer: number;
  skipLocked: boolean;
};

let live: Live | null = null;

const CYCLE: WishRewardKind[] = WISH_REWARD_POOL.map((row) => row.kind);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function wishRewardIconSrc(kind: WishRewardKind): string {
  switch (kind) {
    case "mana":
      return "/art/ui/res/gold.svg";
    case "crystal":
      return "/art/ui/res/crystal.svg";
    case "scroll":
      return "/art/ui/res/scroll-normal.webp";
    case "energy":
      return "/art/ui/res/energy.svg";
    case "skill_mats":
      return "/art/ui/res/skill-mat.svg";
    case "jinmun":
      return "/art/ui/res/jinmun.svg";
    case "grindstone":
      return "/art/ui/res/grindstone.webp";
    case "imprint_stone":
      return "/art/ui/res/imprint-stone.webp";
  }
}

export function wishRewardName(kind: WishRewardKind): string {
  switch (kind) {
    case "mana":
      return t("res.gold");
    case "crystal":
      return t("res.crystal");
    case "scroll":
      return t("res.scrollNormal");
    case "energy":
      return t("res.energy");
    case "skill_mats":
      return t("res.skillMats");
    case "jinmun":
      return t("res.jinmun");
    case "grindstone":
      return t("ui.grindstone");
    case "imprint_stone":
      return t("ui.imprintStone");
  }
}

export function wishRewardHint(kind: WishRewardKind): string {
  switch (kind) {
    case "mana":
      return t("ui.wishTipGold");
    case "crystal":
      return t("ui.wishTipCrystal");
    case "scroll":
      return t("ui.wishTipScroll");
    case "energy":
      return t("ui.wishTipEnergy");
    case "skill_mats":
      return t("ui.wishTipSkillMats");
    case "jinmun":
      return t("ui.wishTipJinmun");
    case "grindstone":
      return t("ui.wishTipGrindstone");
    case "imprint_stone":
      return t("ui.wishTipImprint");
  }
}

export function wishPoolAmtLabel(row: Pick<WishPoolEntry, "min" | "max">): string {
  const min = formatNumber(row.min);
  const max = formatNumber(row.max);
  if (row.min === row.max) return t("ui.wishPoolAmtFixed", { n: min });
  return t("ui.wishPoolAmt", { min, max });
}

let wishTipUiAbort: AbortController | null = null;

function findWishPoolTip(chip: HTMLElement): HTMLElement | null {
  const nested = chip.querySelector<HTMLElement>(".wish-pool-tip");
  if (nested) return nested;
  const kind = chip.dataset.wishKind ?? "";
  if (!kind) return null;
  return (
    Array.from(document.querySelectorAll<HTMLElement>("body > .wish-pool-tip")).find(
      (tip) => tip.dataset.wishTipFor === kind,
    ) ?? null
  );
}

function placeWishPoolTip(chip: HTMLElement, tip: HTMLElement): void {
  const r = chip.getBoundingClientRect();
  const pad = 8;
  const tw = Math.max(tip.offsetWidth, 148);
  const th = Math.max(tip.offsetHeight, 48);
  let left = r.left + r.width / 2;
  const minL = pad + tw / 2;
  const maxL = window.innerWidth - pad - tw / 2;
  left = Math.min(Math.max(minL, left), Math.max(minL, maxL));
  tip.style.setProperty("--wish-tip-arrow-x", `${Math.round(r.left + r.width / 2 - left)}px`);
  tip.style.left = `${Math.round(left)}px`;
  tip.style.transform = "translateX(-50%)";

  const aboveTop = r.top - 8 - th;
  if (aboveTop < pad) {
    tip.classList.add("is-below");
    tip.style.top = `${Math.round(r.bottom + 8)}px`;
    tip.style.bottom = "auto";
  } else {
    tip.classList.remove("is-below");
    tip.style.bottom = `${Math.round(window.innerHeight - r.top + 8)}px`;
    tip.style.top = "auto";
  }
}

export function closeWishPoolTips(root: ParentNode | Document = document): void {
  wishTipUiAbort?.abort();
  wishTipUiAbort = null;
  root.querySelectorAll<HTMLElement>(".wish-pool-chip.is-tip-open").forEach((chip) => {
    chip.classList.remove("is-tip-open");
    chip.setAttribute("aria-expanded", "false");
    const tip = findWishPoolTip(chip);
    if (!tip) return;
    tip.setAttribute("hidden", "");
    tip.classList.remove("is-below");
    tip.style.removeProperty("--wish-tip-arrow-x");
    if (tip.parentElement !== chip) chip.appendChild(tip);
  });
  // Drop orphans left on body after a remount without a matching chip.
  document.querySelectorAll<HTMLElement>("body > .wish-pool-tip").forEach((tip) => {
    const kind = tip.dataset.wishTipFor ?? "";
    const home = kind
      ? document.querySelector<HTMLElement>(`.wish-pool-chip[data-wish-kind="${kind}"]`)
      : null;
    if (home) {
      tip.setAttribute("hidden", "");
      tip.classList.remove("is-below");
      home.appendChild(tip);
      return;
    }
    tip.remove();
  });
}

/** Portal tip to body so facility overflow / #app scale cannot clip it. */
export function openWishPoolTip(chip: HTMLElement): void {
  const tip = findWishPoolTip(chip) ?? chip.querySelector<HTMLElement>(".wish-pool-tip");
  if (!tip) return;
  const kind = chip.dataset.wishKind ?? "";
  if (kind) tip.dataset.wishTipFor = kind;
  document.body.appendChild(tip);
  chip.classList.add("is-tip-open");
  chip.setAttribute("aria-expanded", "true");
  tip.removeAttribute("hidden");
  placeWishPoolTip(chip, tip);
  requestAnimationFrame(() => placeWishPoolTip(chip, tip));

  wishTipUiAbort?.abort();
  const ac = new AbortController();
  wishTipUiAbort = ac;
  const reposition = (): void => {
    if (!chip.isConnected || !chip.classList.contains("is-tip-open")) return;
    placeWishPoolTip(chip, tip);
  };
  window.addEventListener("resize", reposition, { signal: ac.signal });
  window.addEventListener("scroll", reposition, { capture: true, signal: ac.signal });
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

function poolRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>(".wish-pool-list");
}

function poolChips(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".wish-pool-chip"));
}

function buildHops(winIdx: number, count: number): number[] {
  const n = Math.max(1, count);
  const win = ((winIdx % n) + n) % n;
  const loops = 3;
  const hops: number[] = [];
  const total = loops * n + win + 1;
  for (let i = 0; i < total; i++) hops.push(i % n);
  hops[hops.length - 1] = win;
  return hops;
}

function hopDelay(i: number, total: number): number {
  const t = total <= 1 ? 1 : i / (total - 1);
  return Math.round(55 + t * t * 240);
}

function paintHot(index: number, win: boolean): void {
  closeWishPoolTips();
  const chips = poolChips();
  const list = poolRoot();
  list?.classList.add("is-picking");
  chips.forEach((chip, i) => {
    chip.classList.toggle("is-hot", i === index && !win);
    chip.classList.toggle("is-win", win && i === index);
  });
}

function paintWinAmount(reward: WishReward): void {
  const chips = poolChips();
  const idx = CYCLE.indexOf(reward.kind);
  const chip = idx >= 0 ? chips[idx] : null;
  if (!chip) return;
  const amt = chip.querySelector<HTMLElement>(".wish-pool-amt");
  if (amt) amt.textContent = formatNumber(reward.amount);
}

function clearPoolFx(): void {
  closeWishPoolTips();
  poolRoot()?.classList.remove("is-picking");
  poolChips().forEach((chip) => {
    chip.classList.remove("is-hot", "is-win");
    const amt = chip.querySelector<HTMLElement>(".wish-pool-amt");
    const label = chip.dataset.amtLabel;
    if (amt && label) amt.textContent = label;
  });
}

function renderResult(reward: WishReward): string {
  const close = escapeHtml(t("ui.wishClose"));
  return `<div class="settings-layer wish-rite-layer" id="${WISH_REVEAL_LAYER_ID}" aria-hidden="false">
    <button type="button" class="settings-backdrop" id="btn-wish-rite-close" aria-label="${close}"></button>
    <div class="settings-sheet wish-result-sheet" role="dialog" aria-modal="true">
      <button type="button" class="modal-x" data-modal-x-for="btn-wish-rite-close" aria-label="${close}"></button>
      <div class="wish-result-hero">
        <span class="wish-result-chip res-cost-chip">
          <img class="wish-result-ico res-ico" src="${wishRewardIconSrc(reward.kind)}" width="48" height="48" alt="" draggable="false" />
          <strong>${reward.amount}</strong>
        </span>
      </div>
      <button type="button" class="auth-btn-primary full" id="btn-wish-rite-ok">${escapeHtml(t("ui.468266d639"))}</button>
    </div>
  </div>`;
}

function bindResult(layer: HTMLElement | null): void {
  if (!layer) return;
  const close = (): void => dismiss();
  layer.querySelector("#btn-wish-rite-close")?.addEventListener("click", close);
  layer.querySelector("#btn-wish-rite-ok")?.addEventListener("click", close);
}

function showResult(): void {
  if (!live || live.phase === "result") return;
  live.phase = "result";
  clearTimers(live);
  const chips = poolChips();
  const winIdx = Math.max(0, CYCLE.indexOf(live.reward.kind));
  paintHot(winIdx, true);
  paintWinAmount(live.reward);
  const html = renderResult(live.reward);
  const layer = live.host.mount(WISH_REVEAL_LAYER_ID, html);
  if (layer && live.host.dematte) live.host.dematte(layer);
  bindResult(layer);
}

function stepHop(): void {
  if (!live || live.phase !== "spinning") return;
  const hops = live.hops;
  const i = live.hop;
  const idx = hops[i] ?? 0;
  paintHot(idx, false);
  if (i >= hops.length - 1) {
    const winIdx = hops[hops.length - 1] ?? 0;
    paintHot(winIdx, true);
    paintWinAmount(live.reward);
    live.playTimer = window.setTimeout(() => {
      if (live) showResult();
    }, 520);
    return;
  }
  live.hop = i + 1;
  live.playTimer = window.setTimeout(stepHop, hopDelay(i, hops.length));
}

function dismiss(): void {
  const session = live;
  live = null;
  if (!session) return;
  clearTimers(session);
  clearPoolFx();
  session.host.remove(WISH_REVEAL_LAYER_ID);
  session.onDismiss();
}

export function abortWishReveal(): void {
  const session = live;
  live = null;
  if (!session) return;
  clearTimers(session);
  clearPoolFx();
  session.host.remove(WISH_REVEAL_LAYER_ID);
}

export function wishRevealIsOpen(): boolean {
  return live != null;
}

export function remountWishReveal(): void {
  if (!live) return;
  if (live.phase === "spinning") {
    const idx = live.hops[Math.max(0, live.hop - 1)] ?? 0;
    paintHot(idx, false);
    return;
  }
  const html = renderResult(live.reward);
  const layer = live.host.mount(WISH_REVEAL_LAYER_ID, html);
  if (layer && live.host.dematte) live.host.dematte(layer);
  bindResult(layer);
  const winIdx = Math.max(0, CYCLE.indexOf(live.reward.kind));
  paintHot(winIdx, true);
  paintWinAmount(live.reward);
}

export function playWishReveal(
  reward: WishReward,
  host: WishRevealHost,
  onDismiss: () => void,
): void {
  abortWishReveal();
  const chips = poolChips();
  const winIdx = Math.max(0, CYCLE.indexOf(reward.kind));
  const reduced = prefersReducedMotion() || chips.length === 0;
  const hops = chips.length ? buildHops(winIdx, chips.length) : [winIdx];
  const session: Live = {
    reward,
    phase: "spinning",
    host,
    onDismiss,
    hop: 0,
    hops,
    playTimer: 0,
    lockTimer: 0,
    skipLocked: !reduced,
  };
  live = session;
  if (reduced) {
    session.skipLocked = false;
    showResult();
    return;
  }
  const btn = document.querySelector<HTMLButtonElement>("#btn-wish-cast");
  if (btn) btn.disabled = true;
  stepHop();
}
