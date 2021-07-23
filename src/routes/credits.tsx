import { BackArrow, BackButton } from 'components/back-button'
import { InlineLink } from 'components/interactive/inline-link'
import { AddToCollection } from 'components/song-look/song-menu-icons'
import { RootView, TText } from 'components/themed'
import { View, StyleSheet } from 'react-native'

export default function Credits() {
  return (
    <RootView style={{ alignItems: 'center', paddingTop: 32 }}>
      <View style={{ maxWidth: 500 }}>
        <View style={{ flexDirection: 'row' }}>
          <BackButton>
            <BackArrow />
          </BackButton>
          <TText style={styles.head}>Zdroje assetů</TText>
        </View>
        <TText style={styles.text}>
          Většinu funkcionality zpěvníku, export do PDF, editace písní a podobně
          vytvořila{' '}
          <InlineLink to="https://isbl.cz">Isabella Skořepová</InlineLink>
        </TText>

        <TText style={styles.text}>
          Ikonku přidání do kolekce <AddToCollection /> jsem převzala od{' '}
          <InlineLink to="https://smashicons.com/">Smashicons</InlineLink>
        </TText>
        <TText style={styles.text}>
          Některé jiné ikonky jsem převzala odněkud a už si bohužel nepamatuji
          odkud. Ani už nevím, které jsem dělala já a které jsou převzaté :-(
        </TText>
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
