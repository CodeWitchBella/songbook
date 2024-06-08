import { useBasicStyle } from "../themed";
import type { ButtonProps } from "./basic-button";
import { BasicButton } from "./basic-button";

export function ListButton({ style, children, ...rest }: ButtonProps) {
  return (
    <BasicButton
      style={[
        useBasicStyle(),
        {
          borderWidth: 1,
          borderStyle: "solid",
          padding: 10,
          fontSize: 15,

          textAlign: "center",
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </BasicButton>
  );
}
