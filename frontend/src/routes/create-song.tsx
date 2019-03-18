import React from 'react'
import styled from '@emotion/styled'
import Input from 'components/input'
import { errorBoundary } from 'containers/error-boundary'
import { newSong } from 'store/fetchers'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  font-size: 18px;
`

type State = {
  author: string
  title: string
  disabled: boolean
}

class CreateSong extends React.Component<{}, State> {
  state: State = {
    author: '',
    title: '',
    disabled: false,
  }
  submit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()
    const { author, title, disabled } = this.state
    console.log('submit before check', this.state)
    if (!author || !title || disabled) return
    console.log('submit', this.state)
    this.setState({ disabled })
    newSong({
      author,
      title,
    })
      .then(ret => {
        console.log('result', ret)
        if (!ret) throw new Error('newSong failed')
        window.location.pathname = `/edit/${ret}`
      })
      .catch(e => {
        console.error(e)
        this.setState({ disabled: false })
      })
  }

  authorChange = (val: string) => this.setState({ author: val })
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
        <button disabled={this.state.disabled}>Vytvořit</button>
      </Form>
    )
  }
}
export default errorBoundary(CreateSong)
