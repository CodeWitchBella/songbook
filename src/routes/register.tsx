/** @jsxImportSource @emotion/react */

import { useState } from 'react'
import { useLogin } from 'components/use-login'
import { useHistory } from 'react-router'
import { PrimaryButton } from 'components/interactive/primary-button'
import { LargeInput } from 'components/input'
import { BackButton, BackArrow } from 'components/back-button'
import { LoginDone } from 'components/login-done'
import { RootView, TH2 } from 'components/themed'

export default function Register() {
  const login = useLogin()
  const [status, setStatus] = useState('')
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const submit = (evt: { preventDefault(): void }) => {
    evt.preventDefault()
    setStatus('loading')
    if (!email) {
      setStatus('Email nesmí být prázdný')
      return
    }
    if (!(email + '').includes('@')) {
      setStatus('Neplatný email')
      return
    }
    if ((password + '').length < 6) {
      setStatus('Heslo musí mít aspoň 6 znaků')
      return
    }
    if ((name + '').length < 4) {
      setStatus('Jméno musí mít aspoň 4 znaky')
      return
    }
    login
      .register(email, password, name)
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
          Vytvořit účet
        </TH2>
        {login.viewer ? (
          <LoginDone viewer={login.viewer} logout={login.logout} />
        ) : (
          <>
            <div>{status !== 'loading' && status}</div>
            <LargeInput
              label="Zobrazované jméno"
              type="text"
              name="name"
              disabled={status === 'loading'}
              value={name}
              onChange={setName}
            />
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
              Vytvořit účet
            </PrimaryButton>
            <button style={{ display: 'none' }} />
          </>
        )}
      </form>
    </RootView>
  )
}
