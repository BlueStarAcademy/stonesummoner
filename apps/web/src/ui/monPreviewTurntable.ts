/** Drag to flip monster book preview front/back (battle stills or WebP mirror). */

import { dematteArtImg } from "./dematteArt";

export function bindMonPreviewTurntable(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-mon-preview]").forEach((el) => {
    if (el.dataset.turntableBound === "1") return;
    el.dataset.turntableBound = "1";

    const art = el.querySelector<HTMLElement>(".mon-preview-art");
    const img = el.querySelector<HTMLImageElement>("img.mon-preview-img");
    if (!art || !img) return;

    const stillFront = img.dataset.stillFront || "";
    const stillBack = img.dataset.stillBack || stillFront;
    let facingBack = false;
    let dragging = false;
    let lastX = 0;
    let pointerId: number | null = null;
    let dragAccum = 0;

    const apply = (): void => {
      el.classList.toggle("is-back", facingBack);
      el.dataset.facing = facingBack ? "back" : "front";
      if (stillFront) {
        const next = facingBack ? stillBack || stillFront : stillFront;
        const curLogical = img.dataset.dematteSrc || img.getAttribute("src") || "";
        if (curLogical !== next) {
          img.src = next;
          dematteArtImg(img);
        }
        art.classList.remove("is-mirrored");
      } else {
        art.classList.toggle("is-mirrored", facingBack);
      }
    };

    apply();

    const onDown = (ev: PointerEvent): void => {
      if (ev.button !== 0 && ev.pointerType === "mouse") return;
      dragging = true;
      lastX = ev.clientX;
      dragAccum = 0;
      pointerId = ev.pointerId;
      el.classList.add("is-dragging");
      try {
        el.setPointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
      ev.preventDefault();
    };

    const onMove = (ev: PointerEvent): void => {
      if (!dragging || (pointerId != null && ev.pointerId !== pointerId)) return;
      const dx = ev.clientX - lastX;
      lastX = ev.clientX;
      dragAccum += dx;
      if (Math.abs(dragAccum) >= 48) {
        facingBack = !facingBack;
        dragAccum = 0;
        apply();
      }
    };

    const onUp = (ev: PointerEvent): void => {
      if (pointerId != null && ev.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      dragAccum = 0;
      el.classList.remove("is-dragging");
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  });
}
