import { BackButton } from 'components/back-button'
import { View, Text } from 'react-native'

export function ErrorPage({
  text,
  children,
}: {
  text: string
  children?: JSX.Element
}) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        top: 0,
        bottom: 0,
        position: 'absolute',
        left: 0,
        right: 0,
      }}
    >
      <Text style={{ fontSize: 42 }}>{text}</Text>
      {children || null}
      <BackButton style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 22 }}>Vrátit se zpět</Text>
      </BackButton>
    </View>
  )
}

export function NotFound() {
  return <ErrorPage text="Zadaná cesta nebyla nalezena" />
}
