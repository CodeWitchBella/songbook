import { View, Text } from 'react-native'
import { ListButton } from './button'
import React from 'react'
import { User } from 'store/graphql'

export function LoginDone({
  viewer,
  logout,
}: {
  viewer: User
  logout: () => void
}) {
  return (
    <View>
      <Text style={{ fontSize: 16 }}>Hotovo! 🎉</Text>
      <Text style={{ fontSize: 16 }}>Tvé jméno: {viewer.name}</Text>
      <View style={{ height: 12 }} />
      <ListButton style={{ maxWidth: 130 }} onPress={logout}>
        Odhlásit se
      </ListButton>
    </View>
  )
}
