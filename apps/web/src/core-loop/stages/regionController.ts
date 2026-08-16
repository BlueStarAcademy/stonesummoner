/**
 * Host-scoped actions for the core stage flow.
 *
 * The stage sheet is replaced in-place as a player moves from region to prep.
 * Delegating from its stable host makes a stage button work exactly once after
 * every repaint, without document-level click suppression.
 */
export type CoreStageRegionActions = {
  openStage: (stageId: string) => void;
  closeRegion: () => void;
};

export function bindCoreStageRegionController(
  host: HTMLElement,
  actions: CoreStageRegionActions,
): () => void {
  const onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const stage = target.closest<HTMLButtonElement>("[data-core-stage]");
    if (stage && host.contains(stage)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      actions.openStage(stage.dataset.coreStage ?? "");
      return;
    }

    const close = target.closest<HTMLButtonElement>("[data-core-region-close]");
    if (close && host.contains(close)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      actions.closeRegion();
    }
  };

  // Capture ensures legacy per-button handlers cannot duplicate the action.
  host.addEventListener("click", onClick, true);
  return () => host.removeEventListener("click", onClick, true);
}
