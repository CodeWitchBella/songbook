/** @jsxImportSource @emotion/react */

import { View, Pressable, Linking } from 'react-native'
import { PrimaryButton } from 'components/interactive/primary-button'
import { ListButton } from 'components/interactive/list-button'
import { useLogin } from 'components/use-login'
import { buildData } from 'build-data'
import { DateTime } from 'luxon'
import { InstallButtonLook } from 'components/install'
import { TText, useDarkMode } from 'components/themed'

const googleDoc =
  'https://docs.google.com/document/d/1SVadEFoM9ppFI6tOhOQskMs53UxHK1EWYZ7Lr4rAFoc/edit?usp=sharing'

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
        <Gap height={22} />
        {login.viewer ? (
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
        <ListButton to="/changelog">Historie změn</ListButton>
        <Gap />
        <ListButton to="/credits">Credits</ListButton>
        <Gap />
      </View>
      <View style={{ maxWidth: 400 }}>
        <InstallButtonLook>
          <Gap height={30} />
        </InstallButtonLook>
      </View>
      {buildData.commitTime ? (
        <View style={{ bottom: 10, right: 10, position: 'absolute' }}>
          <TText style={{ fontSize: 15 }}>
            Verze:{' '}
            <Pressable
              onPress={() => {
                Linking.openURL('https://github.com/CodeWitchBella/songbook')
              }}
            >
              <TText style={buildData.fallback ? { fontStyle: 'italic' } : {}}>
                {format(buildData.commitTime)}
              </TText>
            </Pressable>
          </TText>
        </View>
      ) : null}
    </View>
  )
}

function format(date: string) {
  let dt = DateTime.fromISO(date)
  if (!dt.isValid) dt = DateTime.local()
  return dt.setZone(DateTime.local().zone).toFormat('d. M. yyyy HH:mm:ss')
}

function Gap({ height = 10 }: { height?: number }) {
  return <View style={{ height }} />
}
