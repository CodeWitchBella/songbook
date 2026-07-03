import { useDarkModeSetting } from "#/components/dark-mode";
import { TText } from "#/components/themed";
import { useTranslation } from "react-i18next";

const dark = new URL("./dark.svg", import.meta.url).href;
const light = new URL("./light.svg", import.meta.url).href;
const automatic = new URL("./automatic.svg", import.meta.url).href;

export function DarkModeSettings() {
  const s = useDarkModeSetting();
  const [t] = useTranslation();
  return (
    <div className="flex max-w-full flex-row justify-between" style={{ marginBlock: 16 }}>
      <Option src={light} text={t("Light")} selected={s.setting === "light"} onSelect={() => s.setSetting("light")} />
      <Option src={dark} text={t("Dark")} selected={s.setting === "dark"} onSelect={() => s.setSetting("dark")} />
      <Option
        src={automatic}
        text={t("Automatic")}
        selected={s.setting === "automatic"}
        onSelect={() => s.setSetting("automatic")}
      />
    </div>
  );
}

function Option({
  src,
  text,
  selected,
  onSelect,
}: {
  src: string;
  text: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "flex w-[512px] max-w-[33%] flex-col border border-solid p-1 " +
        (selected ? "border-black dark:border-white" : "border-transparent")
      }
    >
      <img src={src} className="aspect-square w-full" alt="" />
      <TText style={{ textAlign: "center" }}>{text}</TText>
    </button>
  );
}
