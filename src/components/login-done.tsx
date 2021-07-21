import { View } from 'react-native'
import { User } from 'store/graphql'
import { TText } from './themed'
import { PrimaryButton } from './interactive/primary-button'

export function LoginDone({
  viewer,
  logout,
}: {
  viewer: User
  logout: () => void
}) {
  return (
    <View>
      <TText style={{ fontSize: 16 }}>Hotovo! 🎉</TText>
      <TText style={{ fontSize: 16 }}>Tvé jméno: {viewer.name}</TText>
      <View style={{ height: 12 }} />
      <PrimaryButton style={{ maxWidth: 200 }} onPress={logout}>
        Odhlásit se
      </PrimaryButton>
    </View>
  )
}
