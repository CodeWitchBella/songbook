/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, {
  PropsWithChildren,
  useState,
  useEffect,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react'
import styled from '@emotion/styled'
import { Link } from 'react-router-dom'
import { css } from '@emotion/core'
import useRouter from 'components/use-router'
import { VariableSizeList } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
const a = css`
  color: black;
  text-decoration: none;
  :hover {
    text-decoration: underline;
  }
`

const TheSong = styled.div`
  all: unset;
  font-size: 20px;
  box-sizing: border-box;

  a,
  .title {
    display: inline-block;
    padding: 10px;
    color: black;
  }
  a {
    ${a};
  }
  .title {
    font-weight: bold;
  }
`

export const Print = styled(Link)`
  display: flex;
  font-size: 20px;
  height: 100px;
  align-items: center;
  justify-content: center;
  ${a};
`

function LinkToSong({ id, children }: PropsWithChildren<{ id: string }>) {
  const { history } = useRouter()
  const href = `/song/${id}`
  return (
    <a
      href={href}
      onClick={evt => {
        evt.preventDefault()
        history.push(href, { canGoBack: true })
      }}
    >
      {children}
    </a>
  )
}

export type SongListItem =
  | { slug: string; text: string }
  | { header: string }
  | null

function SongItem(
  props: ({ text: string; slug: string } | { header: string }) & {
    style?: React.CSSProperties
  },
) {
  return (
    <TheSong style={props.style}>
      {'header' in props ? (
        <span className="title">{props.header}</span>
      ) : (
        <LinkToSong id={props.slug}>{props.text}</LinkToSong>
      )}
    </TheSong>
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
  grid-template-rows: repeat(
    ${props => Math.ceil(props.count / 1)},
    auto
  );
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
    if (index === 0) return <div style={style} />
    const item = list[index - 1]
    if (!item) return null
    if ('header' in item) return <SongItem style={style} header={item.header} />

    return <SongItem style={style} slug={item.slug} text={item.text} />
  }

  if (big)
    return (
      <ListContainer count={list.length}>
        {list.map((item, index) => indexToItem({ index: index + 1 }))}
      </ListContainer>
    )

  return (
    <AutoSizer>
      {({ width, height }) => (
        <VariableSizeList
          key={key}
          width={windowWidth}
          height={height}
          itemCount={list.length + 1}
          itemSize={idx => {
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
