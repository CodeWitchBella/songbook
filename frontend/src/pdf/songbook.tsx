/** @jsx R.h */
import { SongType } from 'containers/store/store'
import * as R from './renderer'
import { Text, Column } from './primitives'

const OtherText = ({ children }: { children: string }) => (
  <Text>{children}</Text>
)

const Songbook = ({ songs, blah }: { songs: SongType[]; blah: string }) => (
  <Column>
    <Text size={0.5}>Hello world{blah}</Text>
    <OtherText>Die world</OtherText>
  </Column>
)

export default function printSongbook(songs: SongType[]) {
  if (typeof document === 'undefined') return
  //return R.renderToPdf(<Songbook songs={songs} />)
  R.renderToPdf(<Songbook songs={songs} blah="yada" />)
    //R.renderToPdf(<Text size={0.5}>Hello world</Text>)
    .then(doc => {
      console.log('saving')
      //doc.save('songbook.pdf')
      doc.output('dataurlnewwindow')
    })
}
