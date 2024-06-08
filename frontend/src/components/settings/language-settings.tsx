import { useLanguage } from "components/localisation";
import { TText, useColors } from "components/themed";
import { Pressable, View } from "react-native";

export function LanguageSettings({ compact = false }: { compact?: boolean }) {
  const [lng, setLng] = useLanguage();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "flex-start",
        marginVertical: compact ? 0 : 16,
        maxWidth: "100%",
        flexWrap: "wrap",
      }}
    >
      <Option
        compact={compact}
        short="CS"
        text="Česky"
        selected={lng === "cs"}
        onSelect={() => setLng("cs")}
      />
      <Option
        compact={compact}
        short="EN"
        text="English"
        selected={lng === "en"}
        onSelect={() => setLng("en")}
      />
    </View>
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
  const colors = useColors();
  return (
    <Pressable
      onPress={onSelect}
      style={{
        minWidth: 100,
        width: compact ? 80 : 150,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: !selected ? "transparent" : colors.borders,
        padding: 4,
        justifyContent: "center",
        minHeight: compact ? 36 : undefined,
      }}
    >
      {compact ? null : (
        <TText
          style={{ textAlign: "center", fontSize: 48, marginVertical: 16 }}
        >
          {short}
        </TText>
      )}
      <div className="mt-1 text-center">{text}</div>
    </Pressable>
  );
}
