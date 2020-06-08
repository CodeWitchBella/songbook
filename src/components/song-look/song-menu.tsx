/** @jsx jsx */
/** @jsxFrag React.Fragment */
import { jsx, Interpolation } from '@emotion/core'
import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { Link, LinkProps } from 'react-router-dom'
import {
  PlayButton,
  Burger,
  EditButton,
  InfoButton,
  RandomButton,
} from './song-menu-icons'
import { SongType } from 'store/store-song'
import { useRouterUnsafe } from 'components/use-router'
import { useGetRandomSong } from 'store/store'

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

const menuStyle: Interpolation = {
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

const MenuLink = (props: LinkProps) => {
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
    <button
      type="button"
      css={{
        all: 'unset',
        display: 'flex',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(255,255,255,0.7)',
        pointerEvents: 'all',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={close}
    >
      <div
        css={{
          boxShadow: '10px 10px 36px -8px rgba(0,0,0,0.75)',
          padding: '20px 10px',
          background: 'white',
          fontSize: 18,
        }}
      >
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
      </div>
    </button>
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
  const routerUnsafe = useRouterUnsafe()
  const getRandomSong = useGetRandomSong()

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
                routerUnsafe.history.push('/song/' + nextSong.item.slug)
              }}
            >
              <RandomButton />
            </MenuButton>
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
