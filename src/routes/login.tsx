/** @jsxImportSource @emotion/react */

import { useLogin } from 'components/use-login'
import { PrimaryButton } from 'components/interactive/primary-button'
import { useState } from 'react'
import { useHistory } from 'react-router'
import { LargeInput } from 'components/input'
import { BackButton, BackArrow } from 'components/back-button'
import { LoginDone } from 'components/login-done'
import { RootView, TH2, TText } from 'components/themed'
import { InlineLink } from 'components/interactive/inline-link'
import { View } from 'react-native'

export default function Login() {
  const login = useLogin()
  const [status, setStatus] = useState('')
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (evt: { preventDefault(): void }) => {
    evt.preventDefault()
    setStatus('loading')
    if (!email) {
      setStatus('Email nesmí být prázdný')
    }
    login
      .login(email, password)
      .then((result) => {
        setStatus(result || '')
        if (!result) history.push('/', { canGoBack: true })
      })
      .catch((e) => {
        console.error(e)
        setStatus('Něco se pokazilo')
      })
  }
  return (
    <RootView>
      <form
        onSubmit={submit}
        css={{ fontSize: 20, maxWidth: 500, margin: '0 auto' }}
      >
        <TH2>
          <BackButton>
            <BackArrow />
          </BackButton>
          Přihlášení
        </TH2>
        {login.viewer ? (
          <LoginDone viewer={login.viewer} logout={login.logout} />
        ) : (
          <>
            <TText>{status !== 'loading' && status}</TText>
            <LargeInput
              label="Email"
              value={email}
              onChange={setEmail}
              disabled={status === 'loading'}
              type="email"
              name="email"
            />
            <LargeInput
              label="Heslo"
              value={password}
              onChange={setPassword}
              disabled={status === 'loading'}
              type="password"
              name="password"
            />
            <PrimaryButton onPress={submit} disabled={status === 'loading'}>
              Přihlásit se
            </PrimaryButton>
            <button style={{ display: 'none' }} />
            <View style={{ marginTop: 16, alignItems: 'flex-end' }}>
              <TText style={{ fontSize: 16 }}>
                Nemám účet, <InlineLink to="register">vytvořit nový</InlineLink>
              </TText>
            </View>
          </>
        )}
      </form>
    </RootView>
  )
}
