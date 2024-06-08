import type { PropsWithChildren } from "react";
import { useReducer } from "react";
import { View } from "react-native";

import { OnPressOutside } from "./interactive/press-outside";
import { Burger } from "./song-look/song-menu-icons";
import { useColors } from "./themed";

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
  const colors = useColors();
  return (
    <OnPressOutside onPressOutside={visible ? onClose : null}>
      {(ref) => (
        <View
          ref={ref}
          style={{
            position: "absolute",
            right: 4,
            marginTop: 2,

            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.borders,
            borderStyle: "solid",

            padding: 10,

            display: visible ? "flex" : "none",
            flexDirection: "column",
          }}
        >
          {children}
        </View>
      )}
    </OnPressOutside>
  );
}
