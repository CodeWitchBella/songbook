import { createContext, useCallback, useContext, useEffect, useRef } from "react";

const clickOutsideContext = createContext(false);
let pressOverriden = 0;

export function isPressOverriden() {
  return pressOverriden > 0;
}

export function useInPressOutside() {
  return useContext(clickOutsideContext);
}

let idCounter = 0;

export function OnPressOutside({
  onPressOutside,
  children,
}: {
  onPressOutside: (() => void) | null;
  children: (ref: (el: HTMLElement | null) => void) => null | JSX.Element | readonly JSX.Element[];
}) {
  const handlerRef = useRef(onPressOutside);
  useEffect(() => {
    handlerRef.current = onPressOutside;
    if (onPressOutside) {
      pressOverriden++;
      return () => {
        setTimeout(() => {
          pressOverriden--;
        }, 200);
      };
    }
    return undefined;
  }, [onPressOutside]);

  const id = useRef(0);

  useEffect(() => {
    function listener(event: MouseEvent | TouchEvent) {
      if (
        handlerRef.current &&
        !document.querySelector(`[data-press-outside-id="${id.current}"]`)?.contains(event.target as any)
      ) {
        event.preventDefault();
        handlerRef.current();
      }
    }
    document.body.addEventListener("mousedown", listener);
    document.body.addEventListener("touchstart", listener);
    return () => {
      document.body.removeEventListener("mousedown", listener);
      document.body.removeEventListener("touchstart", listener);
    };
  }, []);
  return (
    <clickOutsideContext.Provider value={true}>
      {children(
        useCallback(el => {
          if (el) {
            if (id.current === 0) {
              idCounter += 1;
              id.current = idCounter;
            }
            el.setAttribute("data-press-outside-id", String(id.current));
          } else {
            id.current = 0;
          }
        }, []),
      )}
    </clickOutsideContext.Provider>
  );
}
