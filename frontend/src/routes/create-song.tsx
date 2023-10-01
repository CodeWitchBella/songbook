/** @jsxImportSource @emotion/react */

import styled from '@emotion/styled'
import { ErrorPage, NotFound } from 'components/error-page'
import { LargeInput } from 'components/input'
import { BasicButton } from 'components/interactive/basic-button'
import { ListButton } from 'components/interactive/list-button'
import { PrimaryButton } from 'components/interactive/primary-button'
import { TText } from 'components/themed'
import { useLogin } from 'components/use-login'
import ErrorBoundary from 'containers/error-boundary'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useLocation, useParams } from 'react-router-dom'
import { useNewSong } from 'store/store'
import type { IntermediateSongData } from 'utils/song-from-link'
import { convertToSong, songDataFromLink } from 'utils/song-from-link'

const FormWrap = styled.div({
  display: 'flex',
  justifyContent: 'center',
  marginTop: '50px',
  maxWidth: '100%',
})

const Form = styled.form`
  display: flex;
  flex-direction: column;
  font-size: 18px;
  max-width: calc(100% - 16px);
  width: 43ch;
  padding: 8px;
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
    maxWidth: '100%',
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
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <CreateSongSwitch />
      {types[type] || <NotFound />}
    </div>
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

const createStyles = StyleSheet.create({
  label: {
    fontWeight: 'bold',
  },
  line: {
    fontSize: 16,
  },
  text: {
    fontSize: 16,
  },
  error: {
    color: 'red',
    paddingVertical: 16,
    fontSize: 16,
  },
})

function CreateSongLink() {
  const location = useLocation()
  const [link, setLink] = useState(getURLFromSearch(location.search))
  const [error, setError] = useState('')

  const { t } = useTranslation()
  const [downloadedSong, setDownloadedSong] =
    useState<IntermediateSongData | null>(null)
  const form = useSubmit(async () => {
    setError('')
    const song = await songDataFromLink(link, t)
    if (typeof song === 'string') {
      setError(song)
      return false
    }
    setDownloadedSong(song)
    return false
  })

  return (
    <FormWrap>
      {downloadedSong ? (
        <ErrorBoundary>
          <SubmitSong
            cancel={() => setDownloadedSong(null)}
            songData={downloadedSong}
          />
        </ErrorBoundary>
      ) : (
        <Form onSubmit={form.submit}>
          <LargeInput
            label={t('create.Link')}
            value={link}
            onChange={setLink}
          />
          <PrimaryButton disabled={form.disabled} onPress={form.submit}>
            {t('create.Download')}
          </PrimaryButton>
          <button disabled={form.disabled} className="hidden" />
          <TText style={createStyles.error}>{error}</TText>
        </Form>
      )}
    </FormWrap>
  )
}

function SubmitSong({
  songData,
  cancel,
}: {
  songData: IntermediateSongData
  cancel: () => void
}) {
  const { t } = useTranslation()
  const [error, setError] = useState('')
  const song = useMemo(() => convertToSong(songData), [songData])
  const newSong = useNewSong()

  const form = useSubmit(async () => {
    setError('')
    return newSong(song).then(
      ({ slug }) => slug,
      () => {
        setError(t('create.Failed to save the song'))
        return false
      },
    )
  })

  return (
    <Form onSubmit={form.submit}>
      <TText style={createStyles.error}>{error}</TText>
      <TText style={createStyles.line}>
        <TText style={createStyles.label}>{t('create.Song name')}:</TText>{' '}
        {song.title}
      </TText>
      <TText style={createStyles.line}>
        <TText style={createStyles.label}>{t('create.Link')}:</TText>{' '}
        {songData.link}
      </TText>
      <TText style={createStyles.line}>
        <TText style={createStyles.label}>{t('create.Song author')}:</TText>{' '}
        {song.author}
      </TText>
      <TText style={createStyles.line}>
        <TText style={createStyles.label}>{t('create.Text')}:</TText>{' '}
      </TText>
      <TText style={createStyles.text}>{song.text}</TText>
      <button disabled={form.disabled} className="hidden" />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <PrimaryButton onPress={cancel} disabled={form.disabled}>
          {t('create.Cancel')}
        </PrimaryButton>
        <PrimaryButton
          disabled={form.disabled}
          onPress={form.submit}
          style={{ marginLeft: 8 }}
        >
          {t('create.Confirm')}
        </PrimaryButton>
      </View>
    </Form>
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
        <button className="hidden" />
      </Form>
    </FormWrap>
  )
}
