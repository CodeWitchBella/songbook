import React, { useRef } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { BasicButton } from './button'
import { Svg, Path } from 'react-native-svg'

export function SearchTextInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const ref = useRef<TextInput>(null)
  return (
    <View style={{ position: 'relative', flexGrow: 1 }}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChange}
        placeholder="Vyhledávání"
        onSubmitEditing={() => {
          ref.current?.blur()
        }}
        returnKeyType="search"
        accessibilityLabel="Vyhledávání"
        style={styles.input}
      />
      <ClearButton onPress={() => onChange('')} />
    </View>
  )
}

function ClearButton({ onPress }: { onPress: () => void }) {
  return (
    <BasicButton
      aria-label="Vyčistit vyhledávání"
      style={{
        position: 'absolute',
        right: 5,
        bottom: 0,
        height: 40,
        width: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={onPress}
    >
      <Svg viewBox="0 0 47.271 47.271" height="25" width="25">
        <Path d="M0 43.279L43.278 0l3.993 3.992L3.992 47.271z" />
        <Path d="M3.992 0l43.279 43.278-3.993 3.992L0 3.992z" />
      </Svg>
    </BasicButton>
  )
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    padding: 0,
    paddingLeft: 10,
    border: '1px solid #222',
    width: 'calc(100% - 4px)',
  },
})
