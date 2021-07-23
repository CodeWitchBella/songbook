import { BackButton, BackArrow } from 'components/back-button'
import { InlineLink } from 'components/interactive/inline-link'
import { ListButton } from 'components/interactive/list-button'
import { RootView, TH2, TText } from 'components/themed'
import { useLogin } from 'components/use-login'
import { Version } from 'components/version'
import { View, StyleSheet } from 'react-native'

const googleDoc =
  'https://docs.google.com/document/d/1SVadEFoM9ppFI6tOhOQskMs53UxHK1EWYZ7Lr4rAFoc/edit?usp=sharing'

export default function About() {
  return (
    <RootView style={{ justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ maxWidth: 500 }}>
        <TH2>
          <BackButton>
            <BackArrow />
          </BackButton>
          Nastavení a info
        </TH2>

        <ListButton to="/credits">Zdroje assetů</ListButton>
        <Gap />
        <ListButton to="/changelog">Historie změn</ListButton>
        <Gap />
        <ListButton to={googleDoc}>Návrhy</ListButton>
        <TH2>Můj účet</TH2>
        <User />
        <TH2>Informace o aplikaci</TH2>
        <View>
          <TText style={style.infoText}>
            Vytvořila{' '}
            <InlineLink to="https://isbl.cz">Isabella Skořepová</InlineLink>{' '}
            2018{endash}2021
          </TText>
        </View>
        <Gap />
        <Version />
      </View>
    </RootView>
  )
}

function User() {
  const login = useLogin()
  return login.viewer ? (
    <>
      <TText
        style={{
          justifyContent: 'center',
          fontSize: 16,
        }}
      >
        {login.viewer.name}
      </TText>
      <Gap />
      <ListButton onPress={login.logout}>Odhlásit se</ListButton>
    </>
  ) : (
    <>
      <ListButton to="/login">Přihlásit se</ListButton>
      <Gap />
      <ListButton to="/register">Vytvořit účet</ListButton>
    </>
  )
}

const style = StyleSheet.create({
  infoText: {
    height: 18,
  },
})

function Gap({ height = 10 }: { height?: number }) {
  return <View style={{ height }} />
}

const endash = '–'
