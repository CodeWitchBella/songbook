/** @jsxImportSource @emotion/react */

import { useState } from 'react'
import styled from '@emotion/styled'
import { LargeInput } from 'components/input'
import { PrimaryButton } from 'components/interactive/primary-button'
import { BasicButton } from 'components/interactive/basic-button'
import { useNewSong } from 'store/store'
import { useLocation, useRouteMatch } from 'react-router-dom'
import { View, StyleSheet } from 'react-native'
import { songFromLink } from 'utils/song-from-link'
import { NotFound } from 'components/error-page'
import { RootView, TText } from 'components/themed'

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

const types: { [type: string]: JSX.Element } = {
  link: <CreateSongLink />,
  manual: <CreateSongManual />,
  switch: <></>,
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 8,
    fontSize: 16,
  },
  active: {
    fontWeight: 'bold',
  },
  switch: { flexDirection: 'row' },
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
    paddingVertical: 20,
  },
  wrap2: {
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 350,
  },
})

export default function CreateSong() {
  const { params } = useRouteMatch<{ type?: string }>()
  const type = params.type ?? 'switch'
  return (
    <RootView style={styles.wrap}>
      <View style={styles.wrap2}>
        <CreateSongSwitch />
        {types[type] || <NotFound />}
      </View>
    </RootView>
  )
}

function SwitchButton({ type, children }: { type: string; children: string }) {
  const { params } = useRouteMatch<{ type?: string }>()
  const activeType = params.type ?? 'switch'
  return (
    <BasicButton
      style={[styles.button, activeType === type ? styles.active : undefined]}
      to={'/new/' + type}
      replace={true}
    >
      {children}
    </BasicButton>
  )
}

function CreateSongSwitch() {
  return (
    <View style={styles.switch}>
      <SwitchButton type="link">Z odkazu</SwitchButton>
      <SwitchButton type="manual">Ručně</SwitchButton>
    </View>
  )
}

function useSubmit(submitter: () => Promise<string | false>) {
  const [disabled, setDisabled] = useState(false)

  const submit = (evt: { preventDefault(): void }) => {
    evt.preventDefault()
    if (disabled) return

    setDisabled(true)

    submitter()
      .then((slug) => {
        console.log('result', slug)
        if (slug) {
          window.location.pathname = `/edit/${slug}`
        } else {
          setDisabled(false)
        }
      })
      .catch((e) => {
        setDisabled(false)
        console.error(e)
      })
  }
  return { submit, disabled }
}

function getURLFromSearch(search: string) {
  function parse(input: string | undefined | null) {
    try {
      if (!input) return ''
      const match = /https?:[^ \n\t]+/.exec(input)
      if (!match) return ''
      const url = new URL(match[0], 'file:///')
      return url.protocol === 'http:' || url.protocol === 'https:'
        ? match[0]
        : ''
    } catch {
      return ''
    }
  }

  const params = new URLSearchParams(search)
  return (
    parse(params.get('url')) ||
    parse(params.get('text')) ||
    parse(params.get('title')) ||
    ''
  )
}

function CreateSongLink() {
  const location = useLocation()
  const [link, setLink] = useState(getURLFromSearch(location.search))
  const [error, setError] = useState('')
  const newSong = useNewSong()
  const { submit, disabled } = useSubmit(async () => {
    setError('')
    const song = await songFromLink(link)
    if (typeof song === 'string') {
      setError(song)
      return false
    }
    return newSong(song).then(({ slug }) => slug)
  })
  return (
    <FormWrap>
      <Form onSubmit={submit}>
        <LargeInput label="Odkaz" value={link} onChange={setLink} />
        <PrimaryButton disabled={disabled} onPress={submit}>
          Vytvořit
        </PrimaryButton>
        <button css={{ display: 'none' }} />
        <TText
          style={{
            color: 'red',
            paddingVertical: 16,
            paddingHorizontal: 8,
            fontSize: 16,
            width: '43ch',
            maxWidth: '100%',
          }}
        >
          {error}
        </TText>
      </Form>
    </FormWrap>
  )
}

function CreateSongManual() {
  const newSong = useNewSong()
  const [author, setAuthor] = useState('')
  const [title, setTitle] = useState('')
  const { submit, disabled } = useSubmit(() =>
    newSong({
      author,
      title,
    }).then(({ slug }) => slug),
  )

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
