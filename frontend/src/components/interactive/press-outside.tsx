import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import type { View } from "react-native";

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
  children: (
    ref: (view: View | null) => void,
  ) => null | JSX.Element | readonly JSX.Element[];
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
        !document
          .querySelector(`[data-press-outside-id="${id.current}"]`)
          ?.contains(event.target as any)
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
        useCallback((view) => {
          if (view) {
            if (id.current === 0) {
              idCounter += 1;
              id.current = idCounter;
            }
            view.setNativeProps({ "data-press-outside-id": id.current });
          } else {
            id.current = 0;
          }
        }, []),
      )}
    </clickOutsideContext.Provider>
  );
}
