import { View } from 'react-native'
import { User } from 'store/graphql'
import { TText } from './themed'
import { useTranslation } from 'react-i18next'
import { InlineLink } from './interactive/inline-link'

export function LoginDone({ viewer }: { viewer: User }) {
  const { t } = useTranslation()
  return (
    <View>
      <TText style={{ fontSize: 16 }}>{t('login.complete')}</TText>
      <TText style={{ fontSize: 16 }}>
        {t('login.Your name: {{name}}', { name: viewer.name })}
      </TText>
      <View style={{ height: 12 }} />
      <InlineLink to="/">{t('login.back-to-homepage')}</InlineLink>
    </View>
  )
}
