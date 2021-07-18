/** @jsxImportSource @emotion/react */

import type { InterpolationPrimitive } from '@emotion/serialize/types'

import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { Link, LinkProps, useHistory } from 'react-router-dom'
import {
  PlayButton,
  Burger,
  EditButton,
  InfoButton,
  RandomButton,
} from './song-menu-icons'
import { SongType } from 'store/store-song'
import { useGetRandomSong, useViewer } from 'store/store'
import { DumbModal } from 'components/dumb-modal'

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

const menuStyle: InterpolationPrimitive = {
  all: 'unset',
  padding: 10,
  fontSize: 25,
  border: '1px solid black',
  background: 'white',
  textAlign: 'right',
  height: 32,
}

const MenuButton = (
  props: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >,
) => <button type="button" css={menuStyle} {...props} />

const MenuLink = (props: LinkProps<any>) => {
  const to = props.to
  return (
    <Link<any>
      css={menuStyle}
      {...props}
      to={(location) => {
        const res = typeof to === 'function' ? to(location) : to
        const obj = typeof res === 'string' ? { pathname: res } : res
        return { ...obj, state: { canGoBack: true, ...obj.state } }
      }}
    />
  )
}

function Info({ close, song }: { close: () => void; song: SongType }) {
  return (
    <DumbModal close={close}>
      <div>Vložil/a: {song.editor ? song.editor.name : 'neznámo kdo'}</div>
      <div>
        Vloženo:{' '}
        {song.insertedAt
          ? song.insertedAt.toFormat('dd. MM. yyyy')
          : 'před 20. 5. 2019'}
      </div>
      <div>Poslední úprava: {song.lastModified.toFormat('dd. MM. yyyy')}</div>
      <div css={{ fontSize: 13, marginTop: 20 }}>
        Klikněte kdekoli pro zavření
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
  const history = useHistory()
  const getRandomSong = useGetRandomSong()

  const [viewer] = useViewer()

  return (
    <MenuWrap>
      <MenuList>
        {open ? (
          <>
            {transposition ? (
              <div css={[menuStyle, { border: 0 }]}>
                {transposition > 0 ? '+' : ''}
                {transposition}
              </div>
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
                const canGoBackRaw = (history.location.state as any)?.canGoBack
                let canGoBack =
                  typeof canGoBackRaw === 'number'
                    ? canGoBackRaw
                    : canGoBackRaw
                    ? 1
                    : 0
                if (!canGoBack) {
                  const location = history.location
                  history.replace('/all-songs')
                  history.push(
                    location.pathname + location.search + location.hash,
                    location.state,
                  )
                  canGoBack = 1
                }

                history.push('/song/' + nextSong.item.slug, {
                  canGoBack: canGoBack + 1,
                })
              }}
            >
              <RandomButton />
            </MenuButton>
            {viewer?.admin ? (
              <MenuLink
                css={{ textAlign: 'center', fontWeight: 'bold' }}
                to={'/add-to-collection/' + slug}
              >
                +
              </MenuLink>
            ) : null}
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
