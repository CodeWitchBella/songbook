import React, { useState } from 'react'
import styled from '@emotion/styled'
import { LargeInput } from 'components/input'
import { errorBoundary } from 'containers/error-boundary'
import Button from 'components/button'
import { useNewSong } from 'store/store'

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

function CreateSong() {
  const newSong = useNewSong()
  const [author, setAuthor] = useState('')
  const [title, setTitle] = useState('')
  const [disabled, setDisabled] = useState(false)

  const submit = (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault()

    console.log('submit', { author, title, disabled })
    if (!author || !title || disabled) return
    setDisabled(true)

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
        setDisabled(false)
      })
  }

  return (
    <FormWrap>
      <Form onSubmit={submit}>
        <LargeInput label="Autor písně" value={author} onChange={setAuthor} />
        <LargeInput label="Jméno písně" value={title} onChange={setTitle} />
        <Button disabled={disabled}>Vytvořit</Button>
      </Form>
    </FormWrap>
  )
}
export default errorBoundary(CreateSong)
