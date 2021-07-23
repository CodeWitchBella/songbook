import { BackButton } from 'components/back-button'
import { RootView, TText } from './themed'

export function ErrorPage({
  text,
  children,
}: {
  text: string
  children?: JSX.Element
}) {
  return (
    <RootView
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
      <TText style={{ fontSize: 42 }}>{text}</TText>
      {children || null}
      <BackButton style={{ marginTop: 16 }}>
        <TText style={{ fontSize: 22 }}>Vrátit se zpět</TText>
      </BackButton>
    </RootView>
  )
}

export function NotFound() {
  return <ErrorPage text="Zadaná cesta nebyla nalezena" />
}
