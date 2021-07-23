/** @jsxImportSource @emotion/react */

import { View } from 'react-native'
import { PrimaryButton } from 'components/interactive/primary-button'
import { ListButton } from 'components/interactive/list-button'
import { useLogin } from 'components/use-login'
import { InstallButtonLook } from 'components/install'
import { useDarkMode } from 'components/themed'
import { Version } from 'components/version'

export default function Home() {
  const login = useLogin()
  const dark = useDarkMode()
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        backgroundColor: dark ? 'black' : 'white',
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          alignItems: 'stretch',
          maxWidth: 300,
          paddingTop: 20,
          paddingBottom: 40,
        }}
      >
        <PrimaryButton to="/all-songs">Všechny písně</PrimaryButton>
        <Gap height={8} />
        {login.viewer ? null : (
          <>
            <Gap />
            <ListButton to="/login">Přihlásit se</ListButton>
          </>
        )}
        <Gap />
        <ListButton to="/new">Přidat píseň</ListButton>
        <Gap />
        <ListButton to="/collections">Kolekce písní</ListButton>
        <Gap />

        <ListButton to="/about">Nastavení a info</ListButton>
        <Gap />
      </View>
      <View style={{ maxWidth: 400 }}>
        <InstallButtonLook>
          <Gap height={30} />
        </InstallButtonLook>
      </View>
      <View style={{ position: 'absolute', right: 16, bottom: 8 }}>
        <Version />
      </View>
    </View>
  )
}

function Gap({ height = 10 }: { height?: number }) {
  return <View style={{ height }} />
}
