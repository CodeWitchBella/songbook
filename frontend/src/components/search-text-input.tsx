import { useRef } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function SearchTextInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const prevValue = useRef(value);
  useEffect(() => {
    prevValue.current = value;
  });
  useEffect(() => {
    const body = document.body;
    body.addEventListener("keydown", listener);
    return () => {
      body.removeEventListener("keydown", listener);
    };

    function listener(event: KeyboardEvent) {
      // ignore shortcuts
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.trim().length !== 1) return;
      const focused = document.activeElement === ref.current;
      if (event.key.length === 1) {
        onChange(prevValue.current + event.key);
        setTimeout(() => {
          ref.current?.focus();
        }, 0);
      }
      if (event.key === "Escape" && focused) {
        ref.current?.blur();
      }
    }
  }, [onChange, value]);
  const { t } = useTranslation();
  return (
    <div className="relative flex grow flex-col">
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={event => {
          event.stopPropagation();
          onChange(event.target.value);
        }}
        placeholder={t("Type to search")}
        onKeyDown={event => {
          if (event.key === "Enter") ref.current?.blur();
        }}
        aria-label="Vyhledávání"
        className="h-10 w-[calc(100%-4px)] border border-solid border-black bg-white pl-2.5 text-black dark:border-white dark:bg-neutral-950 dark:text-white"
      />
      <ClearButton onClick={() => onChange("")} />
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
