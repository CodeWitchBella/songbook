import React from 'react'
import Page from 'components/page'
import styled from '@emotion/styled'
import { ParsedSong } from 'store/parse-song-file'

const Container = styled.nav`
  display: flex;
  height: 100%;
  flex-wrap: wrap;
  font-size: 0.8em;
`

const SongComp = styled.div`
  display: flex;
`

const Col = styled.div`
  max-width: 50%;
`

const Counter = styled.div`
  padding-right: 0.2em;
`

const Spacer = styled.div<{ space: string }>`
  height: ${({ space }) => space};
`

const mapSong = (offset: number = 0) => (song: ParsedSong, i: number) => (
  <SongComp key={song.id}>
    <Counter>{i + 1 + offset}.</Counter>
    <div>
      {song.title} ({song.author.replace(/ /g, '\u00a0')})
    </div>
  </SongComp>
)

const Contents = ({ list, left }: { list: ParsedSong[]; left?: boolean }) => (
  <Page left={left}>
    <Container>
      <Col>
        <Spacer space="6.7em" />
        {list.slice(0, 38).map(mapSong())}
      </Col>
      <Col>
        <Spacer space="2.65em" />
        {list.slice(38).map(mapSong(38))}
      </Col>
    </Container>
  </Page>
)
export default Contents
