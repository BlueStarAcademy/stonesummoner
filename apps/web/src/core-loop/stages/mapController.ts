/**
 * Stable map input for the first core-loop slice.
 *
 * Pins stay inside a pannable map, so binding directly to individual elements
 * after each render made their action depend on global bind order. This
 * controller owns only pin activation; panning remains in the existing map
 * renderer until it is extracted in the next step.
 */
export type CoreStageMapActions = {
  openRegion: (regionId: string) => void;
  locked: () => void;
};

export function bindCoreStageMapController(
  viewport: HTMLElement,
  actions: CoreStageMapActions,
): () => void {
  const onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const pin = target.closest<HTMLButtonElement>("[data-core-region]");
    if (!pin || !viewport.contains(pin)) return;

    // A pointer drag is not a pin activation.
    if (viewport.getAttribute("data-pan-moved") === "1") return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (pin.dataset.locked === "1") {
      actions.locked();
      return;
    }
    actions.openRegion(pin.dataset.coreRegion ?? "");
  };

  viewport.addEventListener("click", onClick, true);
  return () => viewport.removeEventListener("click", onClick, true);
}
