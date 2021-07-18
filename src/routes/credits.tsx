import { BackArrow, BackButton } from 'components/back-button'
import { AddToCollection } from 'components/song-look/song-menu-icons'
import { View, Text, StyleSheet } from 'react-native'

export default function Credits() {
  return (
    <View style={{ alignItems: 'center', marginTop: 32 }}>
      <View style={{ maxWidth: 500 }}>
        <View style={{ flexDirection: 'row' }}>
          <BackButton>
            <BackArrow />
          </BackButton>
          <Text style={styles.head}>Credits</Text>
        </View>
        <Text style={styles.text}>
          Většinu funkcionality zpěvníku, export do PDF, editace písní a podobně
          vytvořila{' '}
          <NewTabLink to="https://isbl.cz">Isabella Skořepová</NewTabLink>
        </Text>

        <Text style={styles.text}>
          Ikonku přidání do kolekce <AddToCollection /> jsem převzala od{' '}
          <NewTabLink to="https://smashicons.com/">Smashicons</NewTabLink>
        </Text>
        <Text style={styles.text}>
          Některé jiné ikonky jsem převzala odněkud a už si bohužel nepamatuji
          odkud. Ani už nevím, které jsem dělala já a které jsou převzaté :-(
        </Text>
      </View>
    </View>
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

function NewTabLink({ to, children }: { to: string; children: string }) {
  return (
    <a href={to} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  )
}
