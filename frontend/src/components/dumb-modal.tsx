import type { ReactNode } from "react";

export function DumbModal({
  close,
  hint,
  className = "px-6 py-5",
  children,
}: {
  close: () => void;
  hint?: ReactNode;
  /** padding (and any other overrides) of the visible card */
  className?: string;
  children: ReactNode;
}) {
  return (
    <dialog
      onClose={close}
      onClick={event => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      ref={openModal}
      // the dialog itself is just a transparent, viewport-filling backdrop area
      // so that the hint below the card can live outside the visible box
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-4 text-inherit backdrop:bg-black/50 backdrop:backdrop-blur-xs"
    >
      <div className="pointer-events-none flex h-full flex-col items-center justify-center gap-3">
        <div
          // this is separate so that clicking near border does not close the dialog
          className={`pointer-events-auto max-h-full overflow-auto rounded-xl border border-black/10 bg-white shadow-2xl dark:border-white/15 dark:bg-neutral-950 ${className}`}
        >
          {children}
        </div>
        {hint ? (
          <div className="pointer-events-none text-center text-[13px] font-medium text-white [text-shadow:0_0_6px_#000,0_1px_2px_#000]">
            {hint}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}

function openModal(dialog: HTMLDialogElement | null) {
  dialog?.showModal();
}
