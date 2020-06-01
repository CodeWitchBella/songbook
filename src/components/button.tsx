import {
  View,
  Text,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native'
import React, { PropsWithChildren } from 'react'
import Hoverable from './interactive/hoverable'

export default function Button({
  children,
  disabled,
  onPress,
}: PropsWithChildren<{
  disabled?: boolean
  onPress?: (event: GestureResponderEvent) => void
}>) {
  return (
    <Hoverable>
      {(hover) => (
        <TouchableOpacity disabled={disabled} onPress={onPress}>
          <View
            style={{
              borderWidth: 2,
              borderColor: 'black',
              borderStyle: 'solid',
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 30,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                textDecorationLine: hover ? 'underline' : 'none',
              }}
            >
              {children}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </Hoverable>
  )
}
