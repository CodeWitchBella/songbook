import type { PropsWithChildren } from "react";
import { useReducer } from "react";

import { OnPressOutside } from "./interactive/press-outside";
import { Burger } from "./song-look/song-menu-icons";

export default function TopMenu({ children }: PropsWithChildren<{}>) {
  const [{ isOpen, wasOpen }, setOpen] = useReducer(
    (st: { isOpen: boolean; wasOpen: boolean }, action: null | false) => {
      if (action === false) return { isOpen: false, wasOpen: true };
      return { isOpen: !st.isOpen, wasOpen: true };
    },
    { isOpen: false, wasOpen: false },
  );
  return (
    <div className="w-10">
      <button
        aria-label="Hlavní menu"
        className="flex h-10 w-10 items-center justify-center border border-current"
        onClick={() => setOpen(null)}
      >
        <Burger />
      </button>
      {wasOpen && (
        <MenuContent onClose={() => setOpen(false)} visible={isOpen}>
          {children}
        </MenuContent>
      )}
    </div>
  );
}

function MenuContent({
  visible,
  children,
  onClose,
}: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
}>) {
  return (
    <OnPressOutside onPressOutside={visible ? onClose : null}>
      {ref => (
        <div
          ref={ref}
          className="absolute right-1 mt-0.5 flex-col border border-solid border-black bg-white p-2.5 dark:border-white dark:bg-neutral-950"
          style={{ display: visible ? "flex" : "none" }}
        >
          {children}
        </div>
      )}
    </OnPressOutside>
  );
}
