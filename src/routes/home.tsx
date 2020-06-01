/** @jsx jsx */
/** @jsxFrag React.Fragment */
import { jsx } from '@emotion/core'
import { View, Text } from 'react-native'
import { PrimaryButton, ListButton } from 'components/button'
import { useHistory } from 'react-router'
import { useLogin } from 'components/use-login'

const googleDoc =
  'https://docs.google.com/document/d/1SVadEFoM9ppFI6tOhOQskMs53UxHK1EWYZ7Lr4rAFoc/edit?usp=sharing'

export default function Home() {
  const history = useHistory()
  const login = useLogin()
  return (
    <View
      style={{ alignItems: 'center', justifyContent: 'center', height: '100%' }}
    >
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'stretch',
          maxWidth: 300,
        }}
      >
        <PrimaryButton
          onPress={() => {
            history.push('/all-songs', { canGoBack: true })
          }}
        >
          Všechny písně
        </PrimaryButton>
        <Gap height={22} />
        {login.viewer ? (
          <>
            <Text
              style={{
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              {login.viewer.name}
            </Text>
            <Gap />
            <ListButton to="/new">Přidat píseň</ListButton>
            <Gap />
            <ListButton onPress={login.logout}>Odhlásit se</ListButton>
          </>
        ) : (
          <>
            <ListButton to="/login">Přihlásit se</ListButton>
            <Gap />
            <ListButton to="/register">Vytvořit účet</ListButton>
          </>
        )}
        <Gap />
        <ListButton to="/collections">Kolekce písní</ListButton>
        <Gap />
        <ListButton to={googleDoc}>Návrhy</ListButton>
        <Gap />
        <ListButton to="/changelog">Seznam změn</ListButton>
        <Gap />
      </View>
    </View>
  )
}

function Gap({ height = 10 }: { height?: number }) {
  return <View style={{ height }} />
}
