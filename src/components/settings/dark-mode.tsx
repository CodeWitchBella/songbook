/** @jsxImportSource @emotion/react */
import { Pressable, View } from 'react-native'
import dark from './dark.svg'
import light from './light.svg'
import automatic from './automatic.svg'
import { TText, useColors } from 'components/themed'
import { useDarkModeSetting } from 'components/dark-mode'
import { useTranslation } from 'react-i18next'

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
        width: '33%',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: !selected ? 'transparent' : colors.borders,
        padding: 4,
      }}
    >
      <img src={src} css={{ width: '100%' }} alt="" />
      <TText style={{ textAlign: 'center' }}>{text}</TText>
    </Pressable>
  )
}
