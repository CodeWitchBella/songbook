import { useDarkModeSetting } from 'components/dark-mode'
import { TText, useColors } from 'components/themed'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

const dark = new URL('./dark.svg', import.meta.url).href
const light = new URL('./light.svg', import.meta.url).href
const automatic = new URL('./automatic.svg', import.meta.url).href

export function DarkModeSettings() {
  const s = useDarkModeSetting()
  const [t] = useTranslation()
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 16,
        maxWidth: '100%',
      }}
    >
      <Option
        src={light}
        text={t('Light')}
        selected={s.setting === 'light'}
        onSelect={() => s.setSetting('light')}
      />
      <Option
        src={dark}
        text={t('Dark')}
        selected={s.setting === 'dark'}
        onSelect={() => s.setSetting('dark')}
      />
      <Option
        src={automatic}
        text={t('Automatic')}
        selected={s.setting === 'automatic'}
        onSelect={() => s.setSetting('automatic')}
      />
    </View>
  )
}

function Option({
  src,
  text,
  selected,
  onSelect,
}: {
  src: string
  text: string
  selected: boolean
  onSelect: () => void
}) {
  const colors = useColors()
  return (
    <Pressable
      onPress={onSelect}
      style={{
        maxWidth: '33%',
        width: 512,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: !selected ? 'transparent' : colors.borders,
        padding: 4,
      }}
    >
      <img src={src} className="aspect-square w-full" alt="" />
      <TText style={{ textAlign: 'center' }}>{text}</TText>
    </Pressable>
  )
}
