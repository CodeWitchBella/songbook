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
  songId,
  transposition,
  setTransposition,
  setSpotifyVisible,
  showSpotify,
}: {
  songId: string
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
  if (open) {
    return (
      <MenuWrap>
        <MenuList>
          {transposition ? (
            <div css={[menuStyle, { border: 0 }]}>
              {transposition > 0 ? '+' : ''}
              {transposition}
            </div>
          ) : null}
          <MenuLink to={`/edit/${songId}`}>
            <EditButton />
          </MenuLink>
          <MenuLink to={`/pdf/${songId}`}>PDF</MenuLink>
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
          <MenuButton onClick={() => setOpen(false)}>
            <Burger />
          </MenuButton>
        </MenuList>
      </MenuWrap>
    )
  }

  return (
    <MenuWrap>
      <MenuButton onClick={() => setOpen(true)}>
        <Burger />
      </MenuButton>
    </MenuWrap>
  )
}
