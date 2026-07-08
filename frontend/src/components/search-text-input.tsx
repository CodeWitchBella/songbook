import { useEffect, useOptimistic, useRef, useTransition } from "react";
import { useTranslation } from "react-i18next";

export function SearchTextInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [optimisticValue, setOptimisticValue] = useOptimistic(value);
  const [, startTransition] = useTransition();

  // Show the new value immediately; `value` itself only catches up once the
  // (async, router-driven) onChange round-trips, which is too slow for fast typing.
  function change(next: string) {
    startTransition(() => {
      setOptimisticValue(next);
      onChange(next);
    });
  }

  useEffect(() => {
    const body = document.body;
    body.addEventListener("keydown", listener);
    return () => {
      body.removeEventListener("keydown", listener);
    };

    function listener(event: KeyboardEvent) {
      // ignore shortcuts
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const focused = document.activeElement === ref.current;
      if (event.key === "Escape" && focused) {
        ref.current?.blur();
        return;
      }
      if (event.key.trim().length !== 1) return;
      // The input's own onChange already handles this keystroke when focused;
      // handling it here too would double the character.
      if (focused) return;
      startTransition(() => {
        setOptimisticValue(optimisticValue + event.key);
        onChange(optimisticValue + event.key);
      });
      setTimeout(() => {
        ref.current?.focus();
      }, 0);
    }
  }, [optimisticValue, onChange, setOptimisticValue, startTransition]);
  const { t } = useTranslation();
  return (
    <div className="relative flex grow flex-col">
      <input
        ref={ref}
        type="search"
        value={optimisticValue}
        onChange={event => {
          event.stopPropagation();
          change(event.target.value);
        }}
        placeholder={t("Type to search")}
        onKeyDown={event => {
          if (event.key === "Enter") ref.current?.blur();
        }}
        aria-label="Vyhledávání"
        className="h-10 w-[calc(100%-4px)] border border-solid border-black bg-white pl-2.5 text-black dark:border-white dark:bg-neutral-950 dark:text-white"
      />
      <ClearButton onClick={() => change("")} />
    </div>
  );
}

function ClearButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      aria-label={t("Clear search")}
      className="absolute bottom-0 right-1 flex h-10 w-10 items-center justify-center"
      onClick={onClick}
    >
      <svg viewBox="0 0 47.271 47.271" height="25" width="25">
        <path fill="currentColor" d="M0 43.279L43.278 0l3.993 3.992L3.992 47.271z" />
        <path fill="currentColor" d="M3.992 0l43.279 43.278-3.993 3.992L0 3.992z" />
      </svg>
    </button>
  );
}
