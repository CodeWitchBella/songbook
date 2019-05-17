/** @jsx jsx */
import { jsx, Interpolation } from '@emotion/core'
import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { Link, LinkProps } from 'react-router-dom'
import { PlayButton, Burger, EditButton } from './song-menu-icons'

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

const MenuList = styled.div({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'right',
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

const MenuLink = (props: LinkProps) => <Link css={menuStyle} {...props} />

export default function SongMenu({
  slug,
  transposition,
  setTransposition,
  setSpotifyVisible,
  showSpotify,
}: {
  slug: string
  transposition: number
  setTransposition: (v: number) => void
  setSpotifyVisible: (v: boolean | ((v: boolean) => boolean)) => void
  showSpotify: boolean
}) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (transposition >= 12) setTransposition(transposition - 12)
    else if (transposition <= -12) setTransposition(transposition + 12)
  })

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
            <MenuLink to={`/edit/${slug}`}>
              <EditButton />
            </MenuLink>
            <MenuLink to={`/pdf/${slug}`}>PDF</MenuLink>
            <MenuButton onClick={() => setTransposition(transposition + 1)}>
              +1
            </MenuButton>
            <MenuButton onClick={() => setTransposition(transposition - 1)}>
              -1
            </MenuButton>
            {showSpotify ? (
              <MenuButton
                onClick={() => {
                  setSpotifyVisible(v => !v)
                }}
              >
                <PlayButton />
              </MenuButton>
            ) : null}
          </>
        ) : null}
        <MenuButton onClick={() => setOpen(o => !o)}>
          <Burger />
        </MenuButton>
      </MenuList>
    </MenuWrap>
  )
}
