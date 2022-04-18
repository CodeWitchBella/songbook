/** @jsxImportSource @emotion/react */

import React, {
  PropsWithChildren,
  useState,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react'
import styled from '@emotion/styled'
import { css } from '@emotion/react'
import useRouter from 'components/use-router'
import { VariableSizeList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { BasicButton } from 'components/interactive/basic-button'
import { useTranslation, TFunction } from 'react-i18next'
import { TText } from 'components/themed'

const TheSong = styled.div`
  all: unset;
  font-size: 20px;
  box-sizing: border-box;

  .title {
    display: inline-block;
    padding: 10px;
  }
`

function LinkToSong({ id, children }: PropsWithChildren<{ id: string }>) {
  const href = `/song/${id}`
  return (
    <BasicButton
      style={{
        textDecorationLine: 'none',
        padding: 10,
        fontSize: 20,
        fontFamily: 'Cantarell',
      }}
      to={href}
    >
      {children}
    </BasicButton>
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
  return (
    <TheSong style={props.style}>
      {'header' in props ? (
        <span className="title">
          <TText style={{ fontSize: 18, fontWeight: 'bold' }}>
            {translateHeader(props.t, props.header)}
          </TText>
        </span>
      ) : (
        <LinkToSong id={props.slug}>{props.text}</LinkToSong>
      )}
    </TheSong>
  )
}

const columns = (n: number) => (p: { count: number }) =>
  css`
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

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  const timer = useRef<ReturnType<typeof setTimeout> | null>()
  useEffect(() => {
    setWidth(window.innerWidth)
    function onResize() {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        setWidth(window.innerWidth)
      }, 100)
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return width
}

export function SongList({ list }: { list: SongListItem[] }) {
  const { t } = useTranslation()
  const windowWidth = useWindowWidth()

  const big = windowWidth >= 800
  const key = useMemo(
    () => Math.random() + '' + list.length + '' + windowWidth,
    [list, windowWidth],
  )
  const heightCache = useMemo(() => {
    return new Map<string, number>()
    // we want to bust the cache if windowWidth changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowWidth])
  const smInnerScrollRef = useRef<HTMLDivElement>(null)
  const bigScrollRef = useRef<HTMLDivElement>()

  const { location } = useRouter()

  useLayoutEffect(() => {
    return () => {
      /* eslint-disable react-hooks/exhaustive-deps */
      try {
        if (
          typeof sessionStorage !== 'undefined' &&
          typeof document !== 'undefined'
        ) {
          if (window.innerWidth >= 800) {
            if (bigScrollRef.current) {
              sessionStorage.setItem(
                `scroll:${location.key}`,
                `${bigScrollRef.current.scrollTop}`,
              )
            }
          } else {
            if (smInnerScrollRef.current) {
              sessionStorage.setItem(
                `scroll:${location.key}`,
                `${smInnerScrollRef.current.parentElement!.scrollTop}`,
              )
            }
          }
        }
      } catch (e) {}
      /* eslint-enable react-hooks/exhaustive-deps */
    }
  }, [location.key])

  useEffect(() => {
    const bckp = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    return () => {
      window.document.body.style.overflow = bckp
    }
  }, [])

  const [measurer] = useState(() => {
    const div = document.createElement('div')
    div.style.fontWeight = 'normal'
    div.style.fontStyle = 'normal'
    div.style.fontSize = '20px'
    div.style.fontFamily = 'Cantarell'
    div.style.position = 'absolute'
    div.style.width = '100%'
    div.style.opacity = '0'
    div.style.pointerEvents = 'none'
    div.style.top = '0'
    div.style.boxSizing = 'border-box'
    div.style.padding = '10px'
    return div
  })
  useLayoutEffect(() => {
    document.body.appendChild(measurer)
    return () => {
      document.body.removeChild(measurer)
    }
  }, [measurer])

  function indexToItem({
    index,
    style,
  }: {
    index: number
    style?: React.CSSProperties
  }) {
    if (index === 0) return <div style={style} key={0} />
    const item = list[index - 1]
    if (!item) return null
    if ('header' in item)
      return <SongItem style={style} header={item.header} key={index} t={t} />

    return (
      <SongItem
        style={style}
        slug={item.slug}
        text={item.text}
        key={item.slug}
        t={t}
      />
    )
  }

  const initialScroll = useRef(
    Number.parseFloat(sessionStorage.getItem(`scroll:${location.key}`) || '0'),
  )

  if (big)
    return (
      <AutoSizer>
        {({ width, height }) => (
          <div
            css={{
              width,
              height,
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <ListContainer
              count={list.length}
              ref={(r) => {
                if (r) {
                  bigScrollRef.current = r
                  r.scrollTo(0, initialScroll.current)
                }
              }}
            >
              {list.map((item, index) => indexToItem({ index: index + 1 }))}
            </ListContainer>
          </div>
        )}
      </AutoSizer>
    )

  return (
    <AutoSizer>
      {({ width, height }) => (
        <VariableSizeList
          innerRef={smInnerScrollRef}
          initialScrollOffset={initialScroll.current}
          key={key}
          width={windowWidth}
          height={height}
          itemCount={list.length + 1}
          itemSize={(idx) => {
            if (idx === 0) return 10
            const item = list[idx - 1]
            if (!item) return 0
            if ('header' in item) return 46
            const cached = heightCache.get(item.text)
            if (cached) return cached

            measurer.style.width = windowWidth + 'px'
            measurer.innerText = item.text
            const v = measurer.clientHeight
            heightCache.set(item.text, v)
            return v
          }}
        >
          {indexToItem}
        </VariableSizeList>
      )}
    </AutoSizer>
  )
}
