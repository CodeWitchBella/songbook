import { startTransition, useCallback, useOptimistic, useRef } from "react";
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

  // location.state only reflects our navigations once the router commits them,
  // which can be several calls later. Mirror the bits we branch on in refs that
  // we update synchronously, and resync from the router whenever it actually
  // moves us (back/forward, a link, ...).
  const stateRef = useRef(location.state as any);
  const keyRef = useRef(location.key);
  const backPendingRef = useRef(false);
  if (keyRef.current !== location.key) {
    keyRef.current = location.key;
    stateRef.current = location.state;
    backPendingRef.current = false;
  }

  const onChangeSearch = useCallback(
    (value: string) => {
      const state = stateRef.current;
      // A navigate(-1) is already in flight; ignore repeats until it lands,
      // otherwise we'd pop more history entries than we pushed.
      if (backPendingRef.current && !value) return;
      if (!value && state?.clearOnBack) {
        backPendingRef.current = true;
        stateRef.current = undefined;
        startTransition(async () => {
          setOpt(null);
          await navigate(-1);
        });
        return;
      }

      const push = !!value && !state?.clearOnBack;
      const locationState = push ? { clearOnBack: true, canGoBack: state?.canGoBack ? 2 : undefined } : state;
      stateRef.current = locationState;

      startTransition(async () => {
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
    [location.search, navigate, setOpt],
  );

  return [opt, onChangeSearch];
}
