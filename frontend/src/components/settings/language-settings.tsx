import { useLanguage } from "#/components/localisation";
import { TText } from "#/components/themed";

export function LanguageSettings({ compact = false }: { compact?: boolean }) {
  const [lng, setLng] = useLanguage();
  return (
    <div className="flex max-w-full flex-row flex-wrap justify-start" style={{ marginBlock: compact ? 0 : 16 }}>
      <Option compact={compact} short="CS" text="Česky" selected={lng === "cs"} onSelect={() => setLng("cs")} />
      <Option compact={compact} short="EN" text="English" selected={lng === "en"} onSelect={() => setLng("en")} />
    </div>
  );
}

function Option({
  short,
  text,
  selected,
  onSelect,
  compact,
}: {
  short: string;
  text: string;
  selected: boolean;
  onSelect: () => void;
  compact: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "flex min-w-[100px] flex-col justify-center border border-solid p-1 " +
        (compact ? "min-h-[36px] w-20 " : "w-[150px] ") +
        (selected ? "border-black dark:border-white" : "border-transparent")
      }
    >
      {compact ? null : <TText style={{ textAlign: "center", fontSize: 48, marginBlock: 16 }}>{short}</TText>}
      <div className="mt-1 text-center">{text}</div>
    </button>
  );
}
