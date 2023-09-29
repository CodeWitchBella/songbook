import { BackButton, BackArrow } from 'components/back-button'
import { InlineLink } from 'components/interactive/inline-link'
import { ListButton } from 'components/interactive/list-button'
import { DarkModeSettings } from 'components/settings/dark-mode'
import { LanguageSettings } from 'components/settings/language-settings'
import { RootView, TH2, TText } from 'components/themed'
import { useLogin } from 'components/use-login'
import { Version } from 'components/version'
import { Trans, useTranslation } from 'react-i18next'
import { View, StyleSheet } from 'react-native'

const googleDoc =
  'https://docs.google.com/document/d/1SVadEFoM9ppFI6tOhOQskMs53UxHK1EWYZ7Lr4rAFoc/edit?usp=sharing'

export default function About() {
  const { t } = useTranslation()
  return (
    <RootView style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="px-1 py-2 max-w-full" style={{ width: 500 }}>
        <TH2>
          <BackButton>
            <BackArrow />
          </BackButton>
          {t('Settings and about')}
        </TH2>

        <ListButton to="/credits">{t('Asset credits')}</ListButton>
        <Gap />
        <ListButton to="/changelog">{t('Changelog')}</ListButton>
        <Gap />
        <ListButton to={googleDoc}>{t('Suggestions')}</ListButton>
        <TH2>{t('My account')}</TH2>
        <User />
        <TH2>{t('Appearance')}</TH2>
        <DarkModeSettings />
        <TH2>{t('Language')}</TH2>
        <LanguageSettings />
        <TH2>{t('About the app')}</TH2>
        <View>
          <TText style={style.infoText}>
            <Trans>
              Created by{' '}
              <InlineLink to="https://isbl.cz">Isabella Skořepová</InlineLink>
            </Trans>
            {` 2016${endash}2022`}
          </TText>
        </View>
        <Gap />
        <Version />
      </div>
    </RootView>
  )
}

function User() {
  const login = useLogin()
  const [t] = useTranslation()
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
      <ListButton onPress={login.logout}>{t('Log out')}</ListButton>
    </>
  ) : (
    <>
      <ListButton to="/login">{t('Log in')}</ListButton>
      <Gap />
      <ListButton to="/register">{t('Register')}</ListButton>
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
