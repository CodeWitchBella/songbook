import React from 'react'
import { hot } from 'react-hot-loader'
import styled, { css } from 'react-emotion'
import { editSong } from 'containers/store/fetchers'
import { Song, Refetch, SongType } from 'containers/store/store'
import { editSongVariables } from 'containers/store/__generated__/editSong'
import Input from 'components/input'
import { SongLook } from 'components/song-look/song-look'
import * as parser from 'utils/parse-song'

type SongPatch = editSongVariables['song']

const Form = styled.form`
  display: flex;
  flex-direction: column;
  font-size: 18px;
`

const textAreaClass = css`
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 100%;
  height: 30em;
`

const Textarea = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => any
}) => (
  <label>
    {label}:{' '}
    <textarea
      className={textAreaClass}
      value={value}
      onChange={evt => {
        evt.preventDefault()
        onChange(evt.target.value)
      }}
    />
  </label>
)

const Columns = styled.div`
  display: flex;
  > * {
    width: 50%;
  }
`

type State = {
  author: string
  tags: string
  title: string
  textWithChords: string
  disabled: boolean
}

class EditSong extends React.Component<{
  song: SongType
  refetch: (force?: boolean) => Promise<any>
}> {
  state: State = {
    author: this.props.song.author,
    tags: this.props.song.tags.map(t => t.id).join(', '),
    title: this.props.song.title,
    textWithChords: this.props.song.textWithChords,

    disabled: false,
  }

  result = () => {
    const { author, tags, title, textWithChords, disabled } = this.state
    return {
      ...this.props.song,
      author,
      title,
      tags: tags.split(',').map(t => t.trim()),
      textWithChords,
    }
  }

  submit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    const { author, title, disabled } = this.state
    console.log('submit before check', this.state)
    if (!author || !title || disabled) return
    console.log('submit', this.state)
    this.setState({ disabled })

    editSong({
      song: this.result(),
    })
      .then(ret => {
        console.log('result', ret)
        if (!ret || !ret.editSong) throw new Error('editSong failed')
      })
      .then(() => this.props.refetch(true))
      .catch(e => {
        console.error(e)
        this.setState({ disabled: false })
      })
  }

  authorChange = (val: string) => this.setState({ author: val })
  tagsChange = (val: string) => this.setState({ tags: val })
  titleChange = (val: string) => this.setState({ title: val })
  textWithChordsChange = (val: string) => this.setState({ textWithChords: val })

  render() {
    return (
      <Columns>
        <Form onSubmit={this.submit}>
          <Input
            label="Autor"
            value={this.state.author}
            onChange={this.authorChange}
          />
          <Input
            label="Jméno songu"
            value={this.state.title}
            onChange={this.titleChange}
          />
          <Input
            label="Tagy"
            value={this.state.tags}
            onChange={this.tagsChange}
          />
          <Textarea
            label="Text"
            value={this.state.textWithChords}
            onChange={this.textWithChordsChange}
          />
          <button disabled={this.state.disabled}>Uložit</button>
        </Form>
        <div>
          <SongLook
            song={this.result()}
            parsed={parser.parseSong(this.state.textWithChords)}
            noEdit
          />
        </div>
      </Columns>
    )
  }
}
export default hot(module)(({ id }: { id: string }) => (
  <Song id={id}>
    {song =>
      song && (
        <Refetch>
          {refetch => <EditSong song={song} refetch={refetch} />}
        </Refetch>
      )
    }
  </Song>
))
