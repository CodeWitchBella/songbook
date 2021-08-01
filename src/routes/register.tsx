/** @jsxImportSource @emotion/react */

import { useState } from 'react'
import { useLogin } from 'components/use-login'
import { useHistory } from 'react-router'
import { PrimaryButton } from 'components/interactive/primary-button'
import { LargeInput } from 'components/input'
import { BackButton, BackArrow } from 'components/back-button'
import { LoginDone } from 'components/login-done'
import { RootView, TH2, TText } from 'components/themed'
import { InlineLink } from 'components/interactive/inline-link'
import { View } from 'components/pdf-render/primitives'
import { Trans, useTranslation } from 'react-i18next'

export default function Register() {
  const { t } = useTranslation()
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
      setStatus(t('Email must not be empty'))
      return
    }
    if (!(email + '').includes('@')) {
      setStatus(t('Invalid email'))
      return
    }
    if ((password + '').length < 6) {
      setStatus(t('Password has to be at least 6 characters long'))
      return
    }
    if ((name + '').length < 4) {
      setStatus(t('Name has to be at least four characters long'))
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
        setStatus(t('Something went wrong'))
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
          {t('Register')}
        </TH2>
        {login.viewer ? (
          <LoginDone viewer={login.viewer} logout={login.logout} />
        ) : (
          <>
            <div>{status !== 'loading' && status}</div>
            <LargeInput
              label={t('Display name')}
              type="text"
              name="name"
              disabled={status === 'loading'}
              value={name}
              onChange={setName}
            />
            <LargeInput
              label={t('Email')}
              value={email}
              onChange={setEmail}
              disabled={status === 'loading'}
              type="email"
              name="email"
            />
            <LargeInput
              label={t('Password')}
              value={password}
              onChange={setPassword}
              disabled={status === 'loading'}
              type="password"
              name="password"
            />

            <PrimaryButton onPress={submit} disabled={status === 'loading'}>
              {t('Create account')}
            </PrimaryButton>
            <button style={{ display: 'none' }} />
            <View style={{ marginTop: 16, alignItems: 'flex-end' }}>
              <TText style={{ fontSize: 16 }}>
                <Trans>
                  I already have account,{' '}
                  <InlineLink to="login">log in</InlineLink>
                </Trans>
              </TText>
            </View>
          </>
        )}
      </form>
    </RootView>
  )
}
