import { BackArrow, BackButton } from 'components/back-button'
import { InlineLink } from 'components/interactive/inline-link'
import { AddToCollection } from 'components/song-look/song-menu-icons'
import { RootView, TText } from 'components/themed'
import { Trans, useTranslation } from 'react-i18next'
import { View, StyleSheet } from 'react-native'

export default function Credits() {
  const { t } = useTranslation()
  return (
    <RootView style={{ alignItems: 'center', paddingTop: 32 }}>
      <View style={{ maxWidth: 500 }}>
        <View style={{ flexDirection: 'row' }}>
          <BackButton>
            <BackArrow />
          </BackButton>
          <TText style={styles.head}>{t('Asset credits')}</TText>
        </View>
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
        <TText style={styles.text}>{t('other-icons')}</TText>
      </View>
    </RootView>
  )
}

const styles = StyleSheet.create({
  head: {
    fontSize: 24,
  },
  text: {
    fontSize: 16,
    marginTop: 8,
  },
})
