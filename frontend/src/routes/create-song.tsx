import React from 'react'
import { hot } from 'react-hot-loader'
import styled from 'react-emotion'
import { newSong } from 'containers/store/fetchers'
import Input from 'components/input'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  font-size: 18px;
`

type State = {
  author: string
  tags: string
  title: string
  disabled: boolean
}

class CreateSong extends React.Component<{}, State> {
  state: State = {
    author: '',
    tags: '',
    title: '',
    disabled: false,
  }
  submit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    const { author, tags, title, disabled } = this.state
    console.log('submit before check', this.state)
    if (!author || !title || disabled) return
    console.log('submit', this.state)
    this.setState({ disabled })
    newSong({
      song: {
        author,
        title,
        tags: tags
          .split(',')
          .map(t => t.trim())
          .filter(t => t !== 'todo')
          .concat(['todo']),
        metadata: {},
        textWithChords: 'Here be dragons...',
      },
    })
      .then(ret => {
        console.log('result', ret)
        if (!ret || !ret.newSong) throw new Error('newSong failed')
      })
      .catch(e => {
        console.error(e)
        this.setState({ disabled: false })
      })
  }

  authorChange = (val: string) => this.setState({ author: val })
  tagsChange = (val: string) => this.setState({ tags: val })
  titleChange = (val: string) => this.setState({ title: val })

  render() {
    return (
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
        <button disabled={this.state.disabled}>Vytvořit</button>
      </Form>
    )
  }
}
export default hot(module)(CreateSong)
