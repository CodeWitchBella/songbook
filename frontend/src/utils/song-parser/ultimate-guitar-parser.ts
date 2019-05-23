import { ParsedSong, SongPage } from './song-parser'

// @ts-ignore
function parse(song: string): SongPage {
  //for (const line of song.split('\n')) {
  //}
}

export function parseSongUltimateGuitar(song: string): ParsedSong {
  return [parse(song)]
}
