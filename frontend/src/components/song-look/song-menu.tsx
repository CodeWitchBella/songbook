import styled from '@emotion/styled'
import { DumbModal } from 'components/dumb-modal'
import { useLanguage } from 'components/localisation'
import { TText } from 'components/themed'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import type { LinkProps } from 'react-router-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useGetRandomSong } from 'store/store'
import type { SongType } from 'store/store-song'
import { formatDate } from 'utils/format-date'

import {
  AddToCollection,
  Burger,
  EditButton,
  InfoButton,
  PlayButton,
  QuickSettings,
  RandomButton,
} from './song-menu-icons'

const MenuWrap = styled.div({
  display: 'flex',
  position: 'absolute',
  bottom: 0,
  width: '100%',
  justifyContent: 'flex-end',
  alignIems: 'start',
  pointerEvents: 'none',
  '> *': {
    pointerEvents: 'auto',
  },
})

const MenuList = styled.ul({
  unset: 'all',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'right',
  margin: 0,
})

function MenuButton(
  props: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
) {
  return (
    <button
      type="button"
      className="h-[50px] border border-solid border-black bg-transparent p-2  text-right text-2xl dark:border-white"
      {...props}
    />
  )
}

function MenuLink(props: LinkProps) {
  const to = props.to
  return (
    <Link
      className="h-[50px] border border-solid border-black bg-transparent p-2  text-right text-2xl dark:border-white"
      {...props}
      to={to}
      state={{ canGoBack: true }}
    />
  )
}

const style = StyleSheet.create({
  modalText: { fontSize: 22 },
  modalCloseInfo: { fontSize: 13, marginTop: 20 },
})

function Info({ close, song }: { close: () => void; song: SongType }) {
  const { t } = useTranslation()
  const [lng] = useLanguage()
  const unknownEditor = t('info.editor-unknown')
  const unknownDate = t('info.inserted-before-2019-05-20')
  return (
    <DumbModal close={close}>
      <div className="flex flex-col">
        <TText style={style.modalText}>
          {t('info.Inserted by: {{editor}}', {
            editor: song.editor?.name || unknownEditor,
          })}
        </TText>
        <TText style={style.modalText}>
          {t('info.Inserted: {{date}}', {
            date: song.insertedAt
              ? formatDate(lng, t, song.insertedAt.toISO())
              : unknownDate,
          })}
        </TText>
        <TText style={style.modalText}>
          {t('info.Last edit: {{date}}', {
            date: formatDate(lng, t, song.lastModified.toISO()),
          })}
        </TText>
        <TText style={[style.modalText, style.modalCloseInfo]}>
          {t('Click on the backdrop to close this')}
        </TText>
      </div>
    </DumbModal>
  )
}

export default function SongMenu({
  song,
  transposition,
  setTransposition,
  setSpotifyVisible,
  showSpotify,
}: {
  song: SongType
  transposition: number
  setTransposition: (v: number) => void
  setSpotifyVisible: (v: boolean | ((v: boolean) => boolean)) => void
  showSpotify: boolean
}) {
  const { slug } = song
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (transposition >= 12) setTransposition(transposition - 12)
    else if (transposition <= -12) setTransposition(transposition + 12)
  })
  const [info, setInfo] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const getRandomSong = useGetRandomSong()

  return (
    <MenuWrap>
      <MenuList>
        {open ? (
          <>
            {transposition ? (
              <span className="h-[50px] bg-transparent p-2  text-right text-2xl">
                {transposition > 0 ? '+' : ''}
                {transposition}
              </span>
            ) : null}
            <MenuButton onClick={() => setTransposition(transposition + 1)}>
              +1
            </MenuButton>
            <MenuButton onClick={() => setTransposition(transposition - 1)}>
              -1
            </MenuButton>
            <MenuLink to={`/edit/${slug}`}>
              <EditButton />
            </MenuLink>
            <MenuButton onClick={() => setInfo((o) => !o)}>
              <InfoButton />
            </MenuButton>
            {showSpotify ? (
              <MenuButton
                onClick={() => {
                  setSpotifyVisible((v) => !v)
                }}
              >
                <PlayButton />
              </MenuButton>
            ) : null}
            <MenuButton
              onClick={() => {
                const nextSong = getRandomSong(song.id)
                const canGoBackRaw = (location.state as any)?.canGoBack
                let canGoBack =
                  typeof canGoBackRaw === 'number'
                    ? canGoBackRaw
                    : canGoBackRaw
                    ? 1
                    : 0
                if (!canGoBack) {
                  navigate('/all-songs', { replace: true })
                  navigate(
                    location.pathname + location.search + location.hash,
                    { state: location.state },
                  )
                  canGoBack = 1
                }

                navigate('/song/' + nextSong.item.slug, {
                  state: { canGoBack: canGoBack + 1 },
                })
              }}
            >
              <RandomButton />
            </MenuButton>
            <MenuLink to={'/add-to-collection/' + slug}>
              <AddToCollection />
            </MenuLink>
            <MenuLink to="/quick-settings">
              <QuickSettings />
            </MenuLink>
          </>
        ) : null}
        <MenuButton onClick={() => setOpen((o) => !o)}>
          <Burger />
        </MenuButton>
      </MenuList>
      {info && <Info song={song} close={() => setInfo(false)} />}
    </MenuWrap>
  )
}
