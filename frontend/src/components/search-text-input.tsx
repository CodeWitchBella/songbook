import { useRef } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";

import { useBasicStyle } from "./themed";

export function SearchTextInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const ref = useRef<TextInput>(null);
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
      const focused = ref.current?.isFocused();
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
    <View style={{ position: "relative", flexGrow: 1 }}>
      <TextInput
        ref={ref}
        value={value}
        onChange={(event) => {
          event.stopPropagation();
          onChange(event.nativeEvent.text);
        }}
        placeholder={t("Type to search")}
        onSubmitEditing={() => {
          ref.current?.blur();
        }}
        returnKeyType="search"
        accessibilityLabel="Vyhledávání"
        style={[styles.input, useBasicStyle()]}
      />
      <ClearButton onClick={() => onChange("")} />
    </View>
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
        <path
          fill="currentColor"
          d="M0 43.279L43.278 0l3.993 3.992L3.992 47.271z"
        />
        <path
          fill="currentColor"
          d="M3.992 0l43.279 43.278-3.993 3.992L0 3.992z"
        />
      </svg>
    </button>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    padding: 0,
    paddingLeft: 10,
    border: "1px solid #222",
    width: "calc(100% - 4px)",
  },
});
