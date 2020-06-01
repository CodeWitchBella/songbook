/** @jsx jsx */
/** @jsxFrag React.Fragment */
import { jsx } from '@emotion/core'
import { useLogin } from 'components/use-login'
import { PrimaryButton, ListButton } from 'components/button'
import { useState } from 'react'
import { useHistory } from 'react-router'
import { LargeInput } from 'components/input'
import { BackButton, BackArrow } from 'components/back-button'
import { View, Text } from 'react-native'

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
    <form
      onSubmit={submit}
      css={{ fontSize: 20, maxWidth: 500, margin: '0 auto' }}
    >
      <h2 css={{ display: 'flex', flexDirection: 'row' }}>
        <BackButton>
          <BackArrow />
        </BackButton>
        Přihlášení
      </h2>
      {login.viewer ? (
        <View>
          <Text style={{ fontSize: 16 }}>Hotovo! 🎉</Text>
          <Text style={{ fontSize: 16 }}>Tvé jméno: {login.viewer.name}</Text>
          <View style={{ height: 12 }} />
          <ListButton style={{ maxWidth: 130 }} onPress={login.logout}>
            Odhlásit se
          </ListButton>
        </View>
      ) : (
        <>
          <div>{status !== 'loading' && status}</div>
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
        </>
      )}
    </form>
  )
}
