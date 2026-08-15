import { animated, useTransition } from "@react-spring/web";
import type { LucideIcon } from "lucide-react";
import { EllipsisVerticalIcon } from "lucide-react";
import type { PropsWithChildren } from "react";
import { useReducer } from "react";

import type { ButtonProps } from "./interactive/basic-button";
import { BasicButton } from "./interactive/basic-button";
import { OnPressOutside } from "./interactive/press-outside";

export function TopMenuItem({ className, icon: Icon, children, ...props }: ButtonProps & { icon: LucideIcon }) {
  return (
    <BasicButton
      className={
        "flex items-center gap-3 px-4 py-2.5 text-left text-base font-normal hover:bg-black/5 hover:no-underline dark:hover:bg-white/10" +
        (className ? " " + className : "")
      }
      {...(props as ButtonProps)}
    >
      <Icon size={20} className="shrink-0" />
      {children}
    </BasicButton>
  );
}

export default function TopMenu({ children }: PropsWithChildren<{}>) {
  const [{ isOpen, wasOpen }, setOpen] = useReducer(
    (st: { isOpen: boolean; wasOpen: boolean }, action: null | false) => {
      if (action === false) return { isOpen: false, wasOpen: true };
      return { isOpen: !st.isOpen, wasOpen: true };
    },
    { isOpen: false, wasOpen: false },
  );
  return (
    <OnPressOutside onPressOutside={isOpen ? () => setOpen(false) : null}>
      {ref => (
        <div ref={ref} className="w-10">
          <button
            aria-label="Hlavní menu"
            aria-expanded={isOpen}
            className="flex h-10 w-10 items-center justify-center border border-current"
            onClick={() => setOpen(null)}
          >
            <EllipsisVerticalIcon size={32} />
          </button>
          {wasOpen && <MenuContent visible={isOpen}>{children}</MenuContent>}
        </div>
      )}
    </OnPressOutside>
  );
}

function MenuContent({ visible, children }: PropsWithChildren<{ visible: boolean }>) {
  const transitions = useTransition(visible, {
    from: { scale: 0.6, y: -8, opacity: 0 },
    enter: { scale: 1, y: 0, opacity: 1 },
    leave: { scale: 0.6, y: -8, opacity: 0 },
    config: { tension: 340, friction: 24, mass: 1 },
  });

  return transitions((style, isVisible) =>
    isVisible ? (
      <animated.div
        style={style}
        className="absolute right-1 z-10 mt-1 flex min-w-56 max-w-[calc(100vw-2rem)] origin-top-right flex-col overflow-hidden rounded-xl border border-black/10 bg-white py-1 shadow-2xl will-change-[transform,opacity] dark:border-white/15 dark:bg-neutral-950"
      >
        {children}
      </animated.div>
    ) : null,
  );
}
