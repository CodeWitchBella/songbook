/** @jsxImportSource @emotion/react */

import { useState } from 'react'
import styled from '@emotion/styled'
import { LargeInput } from 'components/input'
import { PrimaryButton } from 'components/interactive/primary-button'
import { BasicButton } from 'components/interactive/basic-button'
import { useNewSong } from 'store/store'
import { useLocation, useParams } from 'react-router-dom'
import { View, StyleSheet } from 'react-native'
import { songFromLink } from 'utils/song-from-link'
import { ErrorPage, NotFound } from 'components/error-page'
import { RootView, TText } from 'components/themed'
import { useLogin } from 'components/use-login'
import { ListButton } from 'components/interactive/list-button'
import { useTranslation } from 'react-i18next'

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
  const params = useParams<{ type?: string }>()
  const { t } = useTranslation()
  const type = params.type ?? 'switch'
  const login = useLogin()
  if (!login.viewer) {
    return (
      <ErrorPage text={t('You have to be logged in to add a song')}>
        <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 4 }}>
          <ListButton to="/login">{t('Log in')}</ListButton>
          <View style={{ width: 16 }} />
          <ListButton to="/register">{t('Register')}</ListButton>
        </View>
      </ErrorPage>
    )
  }
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
  const params = useParams<{ type?: string }>()
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
  const { t } = useTranslation()
  return (
    <View style={styles.switch}>
      <SwitchButton type="link">{t('create.Using link')}</SwitchButton>
      <SwitchButton type="manual">{t('create.Manually')}</SwitchButton>
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
  const { t } = useTranslation()
  const { submit, disabled } = useSubmit(async () => {
    setError('')
    const song = await songFromLink(link, t)
    if (typeof song === 'string') {
      setError(song)
      return false
    }
    return newSong(song).then(({ slug }) => slug)
  })
  return (
    <FormWrap>
      <Form onSubmit={submit}>
        <LargeInput label={t('create.Link')} value={link} onChange={setLink} />
        <PrimaryButton disabled={disabled} onPress={submit}>
          {t('create.Create')}
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
  const { t } = useTranslation()

  return (
    <FormWrap>
      <Form onSubmit={submit}>
        <LargeInput
          label={t('create.Song author')}
          value={author}
          onChange={setAuthor}
        />
        <LargeInput
          label={t('create.Song name')}
          value={title}
          onChange={setTitle}
        />
        <PrimaryButton disabled={disabled} onPress={submit}>
          {t('create.Create')}
        </PrimaryButton>
        <button css={{ display: 'none' }} />
      </Form>
    </FormWrap>
  )
}
