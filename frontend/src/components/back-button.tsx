import type { CSSProperties, PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router";

export function useGoBack(to = "/") {
  const navigate = useNavigate();
  const location = useLocation();
  return () => {
    const canGoBack = location.state && (location.state as any).canGoBack;
    if (canGoBack) {
      navigate(typeof canGoBack === "number" ? -canGoBack : -1);
    } else {
      navigate(to, { replace: true });
      navigate(location.pathname + location.search + location.hash, {
        state: location.state,
      });
      navigate(-1);
    }
  };
}

export function BackButton({
  children,
  to = "/",
  className,
  style,
}: PropsWithChildren<{
  to?: string;
  className?: string;
  style?: CSSProperties;
}>) {
  return (
    <button onClick={useGoBack(to)} className={className} style={style}>
      {children}
    </button>
  );
}
