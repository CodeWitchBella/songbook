/** @jsx jsx */
import { jsx } from '@emotion/react'
import { useState } from 'react'
import styled from '@emotion/styled'
import { LargeInput } from '../components/input'
import { PrimaryButton } from '../components/interactive/primary-button'
import { useNewSong } from '../store/store'

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

export default function CreateSong() {
  const newSong = useNewSong()
  const [author, setAuthor] = useState('')
  const [title, setTitle] = useState('')
  const [disabled, setDisabled] = useState(false)

  const submit = (evt: { preventDefault(): void }) => {
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
      .catch((e) => {
        console.error(e)
        setDisabled(false)
      })
  }

  return (
    <FormWrap>
      <Form onSubmit={submit}>
        <LargeInput label="Autor písně" value={author} onChange={setAuthor} />
        <LargeInput label="Jméno písně" value={title} onChange={setTitle} />
        <PrimaryButton disabled={disabled} onPress={submit}>
          Vytvořit
        </PrimaryButton>
        <button css={{ display: 'none' }} />
      </Form>
    </FormWrap>
  )
}
