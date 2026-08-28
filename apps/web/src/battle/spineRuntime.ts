/**
 * Pixi + Spine runtime for battle units and monster-book preview.
 * Registered packs only (see spinePacks.ts). Missing assets → WebP stays visible.
 */
import { Application, Assets, Container } from "pixi.js";
import { Spine } from "@esotericsoftware/spine-pixi-v8";
import {
  SPINE_PACKS,
  getSpinePack,
  resolveSpinePackId,
  type SpineClip,
  type SpinePack,
} from "./spinePacks";

export type SpineFacing = "front" | "back";

export interface SpineMountOpts {
  /** Catalog monsterId, or summoner key. */
  catalogId: string;
  facing?: SpineFacing;
  /** Extra scale multiplier. */
  scale?: number;
}

export interface SpineController {
  play(clip: SpineClip, opts?: { loop?: boolean; mix?: number }): void;
  setFacing(facing: SpineFacing): void;
  destroy(): void;
  readonly ready: boolean;
}

type MountRecord = {
  app: Application;
  spine: Spine;
  pack: SpinePack;
  host: HTMLElement;
  canvas: HTMLCanvasElement;
  facing: SpineFacing;
  scaleMul: number;
  ro?: ResizeObserver;
  destroyed: boolean;
  ctrl: SpineController;
};

const byUnitId = new Map<string, SpineController>();
const hostToUnit = new WeakMap<HTMLElement, string>();
let assetsBoot: Promise<void> | null = null;
let pixiCssOnce = false;

function ensurePixiCss(): void {
  if (pixiCssOnce) return;
  pixiCssOnce = true;
  const style = document.createElement("style");
  style.textContent = `
    .spine-host {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 2;
      overflow: hidden;
      background: transparent;
    }
    .spine-host canvas {
      width: 100% !important;
      height: 100% !important;
      display: block;
      background: transparent !important;
    }
    .battle-unit-art.has-spine > .battle-unit-img {
      opacity: 0 !important;
    }
  `;
  document.head.appendChild(style);
}

const loadedPacks = new Set<string>();
const failedPacks = new Set<string>();

async function ensureRequiredAssets(pack: SpinePack): Promise<void> {
  for (const url of pack.requiredAssets ?? []) {
    const response = await fetch(url, { cache: "force-cache" });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || contentType.includes("text/html")) {
      throw new Error(`missing Spine asset: ${url}`);
    }
    const bytes = await response.arrayBuffer();
    if (!bytes.byteLength) throw new Error(`empty Spine asset: ${url}`);
  }
}

async function ensurePackLoaded(pack: SpinePack): Promise<void> {
  if (loadedPacks.has(pack.id)) return;
  if (failedPacks.has(pack.id)) {
    throw new Error(`spine pack unavailable: ${pack.id}`);
  }
  const skAlias = `spine-skel:${pack.id}`;
  const atAlias = `spine-atlas:${pack.id}`;
  try {
    await ensureRequiredAssets(pack);
    Assets.add({ alias: skAlias, src: pack.skeletonUrl });
    Assets.add({ alias: atAlias, src: pack.atlasUrl });
    await Assets.load([skAlias, atAlias]);
    loadedPacks.add(pack.id);
  } catch (err) {
    failedPacks.add(pack.id);
    throw err;
  }
}

async function bootRegisteredPacks(): Promise<void> {
  if (!assetsBoot) {
    assetsBoot = (async () => {
      for (const pack of Object.values(SPINE_PACKS)) {
        if (pack.enabled === false) continue;
        try {
          await ensurePackLoaded(pack);
        } catch (err) {
          console.warn("[spine] pack load failed", pack.id, err);
        }
      }
    })();
  }
  await assetsBoot;
}

function applyFacingSkin(record: MountRecord): void {
  const { spine, pack, facing } = record;
  const skinName =
    facing === "back" ? pack.skins?.back : pack.skins?.front;
  if (!skinName) return;
  try {
    spine.skeleton.setSkinByName(skinName);
    spine.skeleton.setSlotsToSetupPose();
  } catch (err) {
    console.warn("[spine] skin missing", pack.id, skinName, err);
  }
}

function layoutSpine(record: MountRecord): void {
  const { app, spine, pack, host, facing, scaleMul } = record;
  const w = Math.max(2, host.clientWidth || 120);
  const h = Math.max(2, host.clientHeight || 120);
  app.renderer.resize(w, h);
  applyFacingSkin(record);
  const heightScale = (pack.scale * scaleMul * h) / 140;
  const bounds = spine.getLocalBounds();
  const widthScale =
    bounds.width > 0 ? (w * 0.94) / bounds.width : heightScale;
  const s = Math.min(heightScale, widthScale);
  // Prefer distinct back skin; only mirror when pack has no back skin.
  const mirrorBack = facing === "back" && !pack.skins?.back;
  spine.scale.set(mirrorBack ? -Math.abs(s) : Math.abs(s), Math.abs(s));
  spine.position.set(0, 0);
  const rendered = spine.getBounds();
  spine.x = w * 0.5 - (rendered.x + rendered.width * 0.5);
  spine.y = h - pack.offsetY - (rendered.y + rendered.height);
}

/**
 * Mount a Spine skeleton into a host element (battle-unit-art or mon-preview-art).
 * Returns a controller, or null if load/mount fails (WebP remains visible).
 */
export async function mountSpineInHost(
  host: HTMLElement,
  opts: SpineMountOpts,
  unitKey: string,
): Promise<SpineController | null> {
  ensurePixiCss();

  const prevKey = hostToUnit.get(host);
  if (prevKey) byUnitId.get(prevKey)?.destroy();
  byUnitId.get(unitKey)?.destroy();

  const packId = resolveSpinePackId(opts.catalogId);
  if (!packId) return null;
  const pack = getSpinePack(packId);
  if (!pack) return null;

  let app: Application | null = null;
  let wrap: HTMLDivElement | null = null;
  try {
    await bootRegisteredPacks();
    if (!loadedPacks.has(pack.id)) {
      await ensurePackLoaded(pack);
    }
    if (!loadedPacks.has(pack.id)) return null;

    host.querySelector(":scope > .spine-host")?.remove();

    wrap = document.createElement("div");
    wrap.className = "spine-host";
    wrap.setAttribute("aria-hidden", "true");
    host.appendChild(wrap);
    if (getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }

    app = new Application();
    await app.init({
      width: Math.max(2, host.clientWidth || 120),
      height: Math.max(2, host.clientHeight || 140),
      backgroundAlpha: 0,
      antialias: false,
      resolution: Math.min(1.5, window.devicePixelRatio || 1),
      autoDensity: true,
      powerPreference: "low-power",
    });
    wrap.appendChild(app.canvas);

    const skAlias = `spine-skel:${pack.id}`;
    const atAlias = `spine-atlas:${pack.id}`;
    const spine = Spine.from({
      skeleton: skAlias,
      atlas: atAlias,
      scale: 1,
    });
    spine.state.data.defaultMix = 0.15;
    const idleName = pack.clips.idle ?? "idle";
    try {
      const initialFacing = opts.facing ?? "front";
      const initialSkin =
        initialFacing === "back"
          ? pack.skins?.back ?? pack.skins?.front ?? "front"
          : pack.skins?.front ?? "front";
      spine.skeleton.setSkinByName(initialSkin);
      spine.skeleton.setSlotsToSetupPose();
    } catch {
      /* default skin */
    }
    spine.state.setAnimation(0, idleName, true);
    spine.state.addListener({
      event: (_entry, event) => {
        if (event.data?.name !== "attack.hit") return;
        host.dispatchEvent(
          new CustomEvent("spine-attack-hit", {
            bubbles: true,
            detail: { catalogId: opts.catalogId, packId: pack.id },
          }),
        );
      },
    });

    const root = new Container();
    root.addChild(spine);
    app.stage.addChild(root);
    host.classList.add("has-spine");
    host.closest(".battle-unit")?.classList.add("spine-active");

    const record: MountRecord = {
      app,
      spine,
      pack,
      host,
      canvas: app.canvas,
      facing: opts.facing ?? "front",
      scaleMul: opts.scale ?? 1,
      destroyed: false,
      ctrl: null as unknown as SpineController,
    };

    const ctrl: SpineController = {
      ready: true,
      play(clip, playOpts) {
        if (record.destroyed) return;
        const name = record.pack.clips[clip];
        if (!name) return;
        const loop =
          playOpts?.loop ??
          (clip === "idle" || clip === "walk" || clip === "run");
        try {
          if (playOpts?.mix != null) {
            record.spine.state.data.defaultMix = playOpts.mix;
          }
          record.spine.state.setAnimation(0, name, loop);
          if (!loop) {
            const idle = record.pack.clips.idle ?? "idle";
            record.spine.state.addAnimation(0, idle, true, 0);
          }
        } catch (err) {
          console.warn("[spine] play failed", clip, name, err);
        }
      },
      setFacing(next) {
        record.facing = next;
        layoutSpine(record);
      },
      destroy() {
        if (record.destroyed) return;
        record.destroyed = true;
        record.ro?.disconnect();
        byUnitId.delete(unitKey);
        hostToUnit.delete(host);
        try {
          record.app.destroy(true, { children: true, texture: false });
        } catch {
          /* ignore */
        }
        record.canvas.parentElement?.remove();
        host.classList.remove("has-spine");
        host.closest(".battle-unit")?.classList.remove("spine-active");
      },
    };
    record.ctrl = ctrl;
    byUnitId.set(unitKey, ctrl);
    hostToUnit.set(host, unitKey);
    layoutSpine(record);

    const ro = new ResizeObserver(() => {
      if (!record.destroyed) layoutSpine(record);
    });
    ro.observe(host);
    record.ro = ro;

    return ctrl;
  } catch (err) {
    console.warn("[spine] mount failed", opts.catalogId, err);
    try {
      app?.destroy(true, { children: true, texture: false });
    } catch {
      /* ignore cleanup failures */
    }
    wrap?.remove();
    host.classList.remove("has-spine");
    host.closest(".battle-unit")?.classList.remove("spine-active");
    return null;
  }
}

export function getSpineController(unitKey: string): SpineController | null {
  return byUnitId.get(unitKey) ?? null;
}

export function playSpineClip(
  unitKey: string,
  clip: SpineClip,
  opts?: { loop?: boolean },
): boolean {
  const c = byUnitId.get(unitKey);
  if (!c?.ready) return false;
  c.play(clip, opts);
  return true;
}

export function destroyAllSpine(): void {
  for (const c of [...byUnitId.values()]) c.destroy();
  byUnitId.clear();
}

/** Mount Spine on all battle units currently in the DOM. */
export async function mountBattleSpines(root: ParentNode): Promise<void> {
  const units = [
    ...root.querySelectorAll<HTMLElement>(".battle-unit[data-unit]"),
  ];
  await Promise.all(
    units.map(async (el) => {
      const unitId = el.dataset.unit;
      if (!unitId) return;
      const art = el.querySelector<HTMLElement>(".battle-unit-art");
      if (!art) return;
      const catalog = el.dataset.spineId || "";
      if (!catalog || !resolveSpinePackId(catalog)) return;
      const facing: SpineFacing = el.closest(".battle-front.ally")
        ? "back"
        : "front";
      const c = await mountSpineInHost(
        art,
        { catalogId: catalog, facing },
        unitId,
      );
      if (c) art.querySelector<HTMLElement>("[data-unit-anim]")?.remove();
    }),
  );
}

/** Mount Spine on monster-book preview (same packs/skins as battle). */
export async function mountBookPreviewSpine(root: ParentNode): Promise<void> {
  const preview = root.querySelector<HTMLElement>("[data-mon-preview]");
  if (!preview) return;
  const art = preview.querySelector<HTMLElement>(".mon-preview-art");
  if (!art) return;
  const catalog = preview.dataset.monPreview || art.dataset.spineBook || "";
  if (!catalog || !resolveSpinePackId(catalog)) return;
  const facing =
    preview.dataset.facing === "back" || preview.classList.contains("is-back")
      ? "back"
      : "front";
  const ctrl = await mountSpineInHost(
    art,
    { catalogId: catalog, facing, scale: 1.35 },
    `book:${catalog}`,
  );
  if (ctrl) {
    art.classList.remove("is-mirrored");
  }
}
