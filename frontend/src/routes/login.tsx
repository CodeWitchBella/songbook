/** @jsxImportSource @emotion/react */

import { BackArrow, BackButton } from 'components/back-button'
import { LargeInput } from 'components/input'
import { InlineLink } from 'components/interactive/inline-link'
import { PrimaryButton } from 'components/interactive/primary-button'
import { LoginDone } from 'components/login-done'
import { RootView, TH2, TText } from 'components/themed'
import { useLogin } from 'components/use-login'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { View } from 'react-native'

export default function Login() {
  const { t } = useTranslation()
  const login = useLogin()
  const [status, setStatus] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submit = (evt: { preventDefault(): void }) => {
    evt.preventDefault()
    setStatus('loading')
    if (!email) {
      setStatus(t('Email must not be empty'))
    }
    login
      .login(email, password)
      .then((result) => {
        setStatus(result || '')
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
          {t('login-screen-title')}
        </TH2>
        {login.viewer ? (
          <LoginDone viewer={login.viewer} />
        ) : (
          <>
            <TText>{status !== 'loading' && status}</TText>
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
              {t('Log in')}
            </PrimaryButton>
            <button style={{ display: 'none' }} />
            <View style={{ marginTop: 16, alignItems: 'flex-end' }}>
              <TText style={{ fontSize: 16 }}>
                <Trans>
                  I don't have account,{' '}
                  <InlineLink to="/register">register</InlineLink>
                </Trans>
              </TText>
            </View>
          </>
        )}
      </form>
    </RootView>
  )
}
