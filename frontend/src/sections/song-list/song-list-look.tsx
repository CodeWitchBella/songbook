/** @jsxImportSource @emotion/react */

import { css } from '@emotion/react'
import styled from '@emotion/styled'
import type { TFunction } from 'i18next'
import type { PropsWithChildren } from 'react'
import React, { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { Link } from 'react-router-dom'

function LinkToSong({ id, children }: PropsWithChildren<{ id: string }>) {
  const href = `/song/${id}`
  return (
    <Link className="p-2 text-lg" to={href}>
      {children}
    </Link>
  )
}

function translateHeader(
  t: TFunction,
  hdr: 'title' | 'author' | 'text' | 'other',
) {
  if (hdr === 'title') return t('search.title')
  if (hdr === 'author') return t('search.author')
  if (hdr === 'text') return t('search.text')
  if (hdr === 'other') return t('search.other')
  throw new Error('Unknown header')
}
export type HeaderType = Parameters<typeof translateHeader>[1]

export type SongListItem =
  | { slug: string; text: string }
  | { header: HeaderType }
  | null

function SongItem(
  props: ({ text: string; slug: string } | { header: HeaderType }) & {
    style?: React.CSSProperties
    t: TFunction
  },
) {
  return 'header' in props ? (
    <div className="p-2 text-xl font-bold">
      {translateHeader(props.t, props.header)}
    </div>
  ) : (
    <LinkToSong id={props.slug}>{props.text}</LinkToSong>
  )
}

const columns = (n: number) => (p: { count: number }) => css`
  @media (min-width: ${n * 400}px) {
    grid-template-columns: repeat(${n}, 400px);
    grid-template-rows: repeat(${Math.ceil(p.count / n)}, auto);
  }
`

const ListContainer = styled('div')<{ count: number }>`
  display: grid;
  grid-template-columns: repeat(1, 100%);
  grid-template-rows: repeat(${(props) => Math.ceil(props.count / 1)}, auto);
  padding-top: 10px;

  ${columns(2)}
  ${columns(3)}
  ${columns(4)}
  ${columns(5)}
  ${columns(6)}
  ${columns(7)}
  ${columns(8)}

  grid-auto-flow: column;
  justify-content: center;
  box-sizing: border-box;
`

export function SongList({ list }: { list: SongListItem[] }) {
  const { t } = useTranslation()

  const bigScrollRef = useRef<HTMLDivElement>()

  const location = useLocation()

  useLayoutEffect(() => {
    return () => {
      /* eslint-disable react-hooks/exhaustive-deps */
      try {
        const bigScroll = bigScrollRef.current
        if (
          typeof sessionStorage !== 'undefined' &&
          typeof document !== 'undefined' &&
          bigScroll
        ) {
          sessionStorage.setItem(
            `scroll:${location.key}`,
            `${bigScroll.scrollTop}`,
          )
        }
      } catch (e) {
        console.error(e)
      }
    }
  }, [location.key])

  const initialScroll = useRef(
    Number.parseFloat(sessionStorage.getItem(`scroll:${location.key}`) || '0'),
  )
  return (
    <div className="max-h-full w-full overflow-y-scroll">
      <ListContainer
        count={list.length}
        ref={(r) => {
          if (r) {
            bigScrollRef.current = r
            r.scrollTo(0, initialScroll.current)
          }
        }}
      >
        {list.map((item, index) => {
          if (!item) return null
          if ('header' in item)
            return <SongItem header={item.header} key={index} t={t} />

          return (
            <SongItem slug={item.slug} text={item.text} key={item.slug} t={t} />
          )
        })}
      </ListContainer>
    </div>
  )
}
