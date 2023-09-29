import { View } from 'react-native'
import SongList from 'sections/song-list/song-list'

export default function AllSongs() {
  return (
    <View style={{ height: '100%' }}>
      <SongList slug={null} title={null} />
    </View>
  )
}
