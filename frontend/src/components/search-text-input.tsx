import { XIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export function SearchTextInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);

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
      onChange(value + event.key);
      setTimeout(() => {
        ref.current?.focus();
      }, 0);
    }
  }, [value, onChange]);
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
      <XIcon size={25} />
    </button>
  );
}
