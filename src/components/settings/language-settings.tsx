import { Pressable, View } from 'react-native'
import { TText, useColors } from 'components/themed'
import { useLanguage } from 'components/localisation'

export function LanguageSettings() {
  const [lng, setLng] = useLanguage()
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginVertical: 16,
        maxWidth: '100%',
        flexWrap: 'wrap',
      }}
    >
      <Option
        short="CS"
        text="Česky"
        selected={lng === 'cs'}
        onSelect={() => setLng('cs')}
      />
      <Option
        short="EN"
        text="English"
        selected={lng === 'en'}
        onSelect={() => setLng('en')}
      />
    </View>
  )
}

function Option({
  short,
  text,
  selected,
  onSelect,
}: {
  short: string
  text: string
  selected: boolean
  onSelect: () => void
}) {
  const colors = useColors()
  return (
    <Pressable
      onPress={onSelect}
      style={{
        minWidth: 100,
        width: 150,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: !selected ? 'transparent' : colors.borders,
        padding: 4,
      }}
    >
      <TText style={{ textAlign: 'center', fontSize: 48, marginVertical: 16 }}>
        {short}
      </TText>
      <TText style={{ textAlign: 'center' }}>{text}</TText>
    </Pressable>
  )
}
