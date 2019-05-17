import React from 'react'
import styled from '@emotion/styled'
import { LargeInput } from 'components/input'
import { errorBoundary } from 'containers/error-boundary'
import { newSong } from 'store/fetchers'
import Button from 'components/button'

const FormWrap = styled.div({
  display: 'flex',
  justifyContent: 'center',
  marginTop: '50px',
})

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
      .then(({ slug }) => {
        console.log('result', slug)
        window.location.pathname = `/edit/${slug}`
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
      <FormWrap>
        <Form onSubmit={this.submit}>
          <LargeInput
            label="Autor písně"
            value={this.state.author}
            onChange={this.authorChange}
          />
          <LargeInput
            label="Jméno písně"
            value={this.state.title}
            onChange={this.titleChange}
          />
          <Button disabled={this.state.disabled}>Vytvořit</Button>
        </Form>
      </FormWrap>
    )
  }
}
export default errorBoundary(CreateSong)
