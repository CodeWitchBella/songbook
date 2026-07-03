import type { ButtonProps } from "./basic-button";
import { BasicButton } from "./basic-button";
export type { ButtonProps } from "./basic-button";

export function PrimaryButton({ style, className, children, ...rest }: ButtonProps) {
  return (
    <BasicButton
      className={
        "rounded-[30px] border-2 border-solid border-black bg-white p-5 text-center text-xl dark:border-white dark:bg-neutral-950" +
        (className ? " " + className : "")
      }
      style={style}
      {...rest}
    >
      {children}
    </BasicButton>
  );
}
