import { useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

type Setter = (
  value: string | null,
  opts?: { push?: boolean; state?: any },
) => void;
export function useQueryParam(param: string): [string | null, Setter] {
  const [params, setParam] = useSearchParams();
  const value = params.get(param);
  const location = useLocation();

  const setValueOnRouter = useCallback<Setter>(
    (
      value,
      {
        push = false,
        state: locationState,
      }: { push?: boolean; state?: any } = {},
    ) => {
      const copy = new URLSearchParams(params);
      if (value) copy.set(param, value);
      else copy.delete(param);
      setParam(copy, {
        replace: !push,
        state: locationState || location.state,
      });
    },
    [location.state, param, params, setParam],
  );

  return [value, setValueOnRouter];
}
