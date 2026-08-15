import { startTransition, useCallback, useOptimistic } from "react";
import { useLocation, useNavigate } from "react-router";

type Setter = (value: string | null, opts?: { push?: boolean; state?: any }) => void;
export function useQueryParam(param: string): [string | null, Setter] {
  const location = useLocation();
  const navigate = useNavigate();
  const value = new URLSearchParams(location.search).get(param);
  const [opt, setOpt] = useOptimistic(value);

  const setValueOnRouter = useCallback<Setter>(
    (value, { push = false, state: locationState }: { push?: boolean; state?: any } = {}) => {
      const copy = new URLSearchParams(location.search);
      if (value) copy.set(param, value);
      else copy.delete(param);
      startTransition(async () => {
        setOpt(value);
        await navigate(
          {
            search: copy.toString(),
          },
          {
            replace: !push,
            state: locationState || location.state,
          },
        );
      });
    },
    [location.state, param, navigate, location.search, setOpt],
  );

  return [opt, setValueOnRouter];
}

export function useQueryParamQ(): [string | null, (value: string) => void] {
  const param = "q";
  const location = useLocation();
  const navigate = useNavigate();
  const value = new URLSearchParams(location.search).get(param);
  const [opt, setOpt] = useOptimistic(value);

  const onChangeSearch = useCallback(
    (value: string) => {
      startTransition(async () => {
        const state = location.state as any;
        if (!value && state?.clearOnBack) {
          navigate(-1);
          return;
        }

        const push = !!value && !state?.clearOnBack;
        const locationState = push
          ? { clearOnBack: true, canGoBack: state?.canGoBack ? 2 : undefined }
          : location.state;

        const copy = new URLSearchParams(location.search);
        if (value) copy.set(param, value);
        else copy.delete(param);
        setOpt(value || null);
        await navigate(
          {
            search: copy.toString(),
          },
          {
            replace: !push,
            state: locationState,
          },
        );
      });
    },
    [location.state, location.search, navigate, setOpt],
  );

  return [opt, onChangeSearch];
}
