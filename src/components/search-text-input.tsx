import React, { useRef } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import { BasicButton } from './interactive/basic-button'
import { Svg, Path } from 'react-native-svg'
import { useBasicStyle } from './themed'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function SearchTextInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const ref = useRef<TextInput>(null)
  const prevValue = useRef(value)
  useEffect(() => {
    prevValue.current = value
  })
  useEffect(() => {
    const body = document.body
    body.addEventListener('keydown', listener)
    return () => {
      body.removeEventListener('keydown', listener)
    }

    function listener(event: KeyboardEvent) {
      // ignore shortcuts
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const focused = ref.current?.isFocused()
      if (event.key.length === 1) {
        onChange(prevValue.current + event.key)
        setTimeout(() => {
          ref.current?.focus()
        }, 0)
      }
      if (event.key === 'Escape' && focused) {
        ref.current?.blur()
      }
    }
  }, [onChange, value])
  const { t } = useTranslation()
  return (
    <View style={{ position: 'relative', flexGrow: 1 }}>
      <TextInput
        ref={ref}
        value={value}
        onChange={(event) => {
          event.stopPropagation()
          onChange(event.nativeEvent.text)
        }}
        placeholder={t('Type to search')}
        onSubmitEditing={() => {
          ref.current?.blur()
        }}
        returnKeyType="search"
        accessibilityLabel="Vyhledávání"
        style={[styles.input, useBasicStyle()]}
      />
      <ClearButton onPress={() => onChange('')} />
    </View>
  )
}

function ClearButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()
  return (
    <BasicButton
      aria-label={t('Clear search')}
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
        <Path
          fill="currentColor"
          d="M0 43.279L43.278 0l3.993 3.992L3.992 47.271z"
        />
        <Path
          fill="currentColor"
          d="M3.992 0l43.279 43.278-3.993 3.992L0 3.992z"
        />
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
