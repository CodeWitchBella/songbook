import type { CSSProperties, HTMLAttributes } from "react";
import { forwardRef } from "react";

import { useDarkModeSetting } from "./dark-mode";

const colors = {
  dark: {
    background: "#09090b",
    text: "white",
    borders: "white",
    dark: true,
    inputBackground: "#111",
    chord: "#EE0",
  },
  light: {
    background: "white",
    text: "black",
    borders: "black",
    dark: false,
    inputBackground: "white",
    chord: "#9917DA",
  },
};
export function getColors(dark: boolean) {
  return dark ? colors.dark : colors.light;
}

export function useColors() {
  return getColors(useDarkModeSetting().value);
}

export type TStyleProp<T> = undefined | null | false | T | TStyleProp<T>[];
type TCSS = CSSProperties & {
  // React Native style shorthands that used to be passed in; translated to CSS
  // by flattenStyle below.
  marginVertical?: string | number;
  marginHorizontal?: string | number;
  paddingVertical?: string | number;
  paddingHorizontal?: string | number;
};
export type TTextProps = Omit<HTMLAttributes<HTMLSpanElement>, "style"> & {
  style?: TStyleProp<TCSS>;
  href?: string;
  children?: React.ReactNode;
};

// Flattens a (possibly nested) style array into a single CSSProperties object,
// translating the few React Native style shorthands that were still in use.
function flattenStyle(style: TStyleProp<TCSS>, out: Record<string, unknown> = {}): CSSProperties {
  if (!style) return out as CSSProperties;
  if (Array.isArray(style)) {
    for (const item of style) flattenStyle(item, out);
    return out as CSSProperties;
  }
  for (const [key, value] of Object.entries(style)) {
    switch (key) {
      case "marginVertical":
        out.marginBlock = value;
        break;
      case "marginHorizontal":
        out.marginInline = value;
        break;
      case "paddingVertical":
        out.paddingBlock = value;
        break;
      case "paddingHorizontal":
        out.paddingInline = value;
        break;
      default:
        out[key] = value;
    }
  }
  return out as CSSProperties;
}

export const TText = forwardRef<HTMLSpanElement, TTextProps>(({ style, className, ...rest }, ref) => {
  return (
    <span ref={ref} className={"text-black dark:text-white" + (className ? " " + className : "")} style={flattenStyle(style)} {...rest} />
  );
});

export function TH2({ style, className, ...rest }: TTextProps) {
  return (
    <TText
      className={"mb-4 mt-8 flex flex-row text-xl" + (className ? " " + className : "")}
      style={style}
      {...rest}
    />
  );
}

export function TH3({ style, className, ...rest }: TTextProps) {
  return (
    <TText
      className={"mb-2 mt-4 flex flex-row font-bold text-base" + (className ? " " + className : "")}
      style={style}
      {...rest}
    />
  );
}

export function TP({ children, className, style, ...rest }: TTextProps) {
  return (
    <p className={"mt-2 indent-2" + (className ? " " + className : "")} style={flattenStyle(style)} {...rest}>
      {children}
    </p>
  );
}
