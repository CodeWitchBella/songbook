import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import type { User } from 'store/graphql'

import { InlineLink } from './interactive/inline-link'
import { TText } from './themed'

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
