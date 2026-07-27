/** Drag-to-orbit monster preview (CSS rotateY turntable). */

export function bindMonPreviewTurntable(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-mon-preview]").forEach((el) => {
    if (el.dataset.turntableBound === "1") return;
    el.dataset.turntableBound = "1";

    const spinner = el.querySelector<HTMLElement>(".mon-preview-spin");
    const facing = el.querySelector<HTMLElement>(".mon-preview-facing");
    if (!spinner) return;

    let yaw = Number(el.dataset.yaw ?? "12") || 12;
    let dragging = false;
    let lastX = 0;
    let pointerId: number | null = null;

    const apply = (): void => {
      yaw = ((yaw % 360) + 360) % 360;
      el.dataset.yaw = String(Math.round(yaw));
      spinner.style.setProperty("--yaw", `${yaw}deg`);
      const back = yaw > 90 && yaw < 270;
      el.classList.toggle("is-back", back);
      if (facing) facing.textContent = back ? "B" : "F";
    };

    apply();

    const onDown = (ev: PointerEvent): void => {
      if (ev.button !== 0 && ev.pointerType === "mouse") return;
      dragging = true;
      lastX = ev.clientX;
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
      yaw += dx * 0.55;
      apply();
    };

    const onUp = (ev: PointerEvent): void => {
      if (pointerId != null && ev.pointerId !== pointerId) return;
      dragging = false;
      pointerId = null;
      el.classList.remove("is-dragging");
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  });
}
