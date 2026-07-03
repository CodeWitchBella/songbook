import type { ButtonProps } from "./basic-button";
import { BasicButton } from "./basic-button";

export function ListButton({ style, className, children, ...rest }: ButtonProps) {
  return (
    <BasicButton
      className={
        "border border-solid border-black bg-white p-2.5 text-center text-[15px] dark:border-white dark:bg-neutral-950" +
        (className ? " " + className : "")
      }
      style={style}
      {...rest}
    >
      {children}
    </BasicButton>
  );
}
