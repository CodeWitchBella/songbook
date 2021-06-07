import { View, Text } from 'react-native'

export default function NotFound() {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        top: 0,
        bottom: 0,
        position: 'absolute',
        left: 0,
        right: 0,
      }}
    >
      <Text style={{ fontSize: 42 }}>Zadaná cesta nebyla nalezena</Text>
    </View>
  )
}
