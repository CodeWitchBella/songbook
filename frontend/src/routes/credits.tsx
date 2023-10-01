import { InlineLink } from 'components/interactive/inline-link'
import { PageHeader } from 'components/page-header'
import {
  AddToCollection,
  QuickSettings,
} from 'components/song-look/song-menu-icons'
import { TText } from 'components/themed'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'

export default function Credits() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto w-full max-w-lg px-1 pb-2">
      <PageHeader>{t('Asset credits')}</PageHeader>
      <TText style={styles.text}>
        <Trans>
          credits-blurp <InlineLink to="https://isbl.cz">author</InlineLink>
        </Trans>
      </TText>

      <TText style={styles.text}>
        <Trans>
          Icon for adding to collection <AddToCollection /> is taken from{' '}
          <InlineLink to="https://smashicons.com/">Smashicons</InlineLink>
        </Trans>
      </TText>
      <TText style={styles.text}>
        <Trans>
          Icon for quick settings <QuickSettings /> is taken from{' '}
          <InlineLink to="https://iconic.app/">
            {{ iconicApp } as any}
          </InlineLink>
        </Trans>
      </TText>
      <TText style={styles.text}>{t('other-icons')}</TText>
    </div>
  )
}
const iconicApp = 'iconic.app'

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    marginTop: 8,
  },
})
