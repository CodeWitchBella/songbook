import type { TStyleProp } from "#/components/themed";
import { TText } from "#/components/themed";
import type { CSSProperties, MouseEvent, PropsWithChildren } from "react";
import { useCallback } from "react";
import { useNavigate } from "react-router";

import { isPressOverriden, useInPressOutside } from "./press-outside";

type ButtonPropsBase<T> = PropsWithChildren<
  {
    disabled?: boolean;
    style?: TStyleProp<CSSProperties>;
    className?: string;
  } & T
>;

type ButtonPropsNonLink = ButtonPropsBase<{
  onPress?: (event: { preventDefault(): void }) => void;
}>;

type ButtonPropsLink = ButtonPropsBase<{ to: string; replace?: boolean }>;

export type ButtonProps = ButtonPropsLink | ButtonPropsNonLink;

export function useLinkOnPress(to: string, { replace = false }: { replace?: boolean } = {}) {
  const navigate = useNavigate();
  return useCallback(
    (event?: { preventDefault?: () => any }) => {
      event?.preventDefault?.();
      if (to.startsWith("http://") || to.startsWith("https://")) {
        window.open(to, "_blank", "noopener,noreferrer");
      } else {
        navigate(to, { state: { canGoBack: true }, replace });
      }
    },
    [navigate, replace, to],
  );
}

function BasicButtonBase({ children, disabled, style, className, ...rest }: ButtonPropsNonLink & { href?: string }) {
  const inPressOutside = useInPressOutside();

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    if (disabled) return;
    if (isPressOverriden() && !inPressOutside) return;
    rest.onPress?.(event);
  };

  const containerClass = "flex flex-col items-stretch justify-center";
  const inner = (
    <TText className={"hover:underline" + (className ? " " + className : "")} style={style}>
      {children}
    </TText>
  );

  if (rest.href) {
    return (
      // eslint-disable-next-line jsx-a11y/anchor-is-valid
      <a href={rest.href} className={containerClass} onClick={handleClick}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" disabled={disabled} className={containerClass} onClick={handleClick}>
      {inner}
    </button>
  );
}

function BasicButtonLink({ to, replace, ...rest }: ButtonPropsLink) {
  return <BasicButtonBase onPress={useLinkOnPress(to, { replace })} href={to} {...rest} />;
}

export function BasicButton(props: ButtonProps) {
  if ("to" in props) return <BasicButtonLink {...props} />;
  return <BasicButtonBase {...props} />;
}
