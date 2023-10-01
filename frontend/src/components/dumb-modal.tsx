export function DumbModal({
  close,
  children,
}: {
  close: () => void
  children: JSX.Element | readonly JSX.Element[]
}) {
  return (
    <dialog
      onClose={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
      ref={openModal}
      // modal does not inhert text color by default, let's change that
      className="border border-black bg-white text-inherit backdrop:bg-black/70 dark:border-white dark:bg-neutral-950"
    >
      <div
        // this is separate so that clicking near border does not close the dialog
        className="px-4 py-6"
      >
        {children}
      </div>
    </dialog>
  )
}

function openModal(dialog: HTMLDialogElement | null) {
  dialog?.showModal()
}
