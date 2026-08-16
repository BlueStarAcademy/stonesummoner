/**
 * The essential prep actions are delegated from the persistent stage host.
 * They survive dock and modal repainting without relying on the global binder.
 */
export type CoreStagePrepActions = {
  start: () => void;
  cancel: () => void;
};

export function bindCoreStagePrepController(
  host: HTMLElement,
  actions: CoreStagePrepActions,
): () => void {
  const onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>("[data-core-prep-action]");
    if (!button || !host.contains(button)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.dataset.corePrepAction === "start") actions.start();
    if (button.dataset.corePrepAction === "cancel") actions.cancel();
  };

  host.addEventListener("click", onClick, true);
  return () => host.removeEventListener("click", onClick, true);
}
