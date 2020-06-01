import { View } from 'react-native'
import React from 'react'
import { PrimaryButton, ListButton } from 'components/button'
import { useHistory } from 'react-router'

export default function Home() {
  const history = useHistory()
  return (
    <View style={{ justifyContent: 'center' }}>
      <PrimaryButton
        onPress={() => {
          history.push('/all-songs', { canGoBack: true })
        }}
      >
        Všechny písně
      </PrimaryButton>
      <ListButton to="/collections">Kolekce písní</ListButton>
    </View>
  )
}
