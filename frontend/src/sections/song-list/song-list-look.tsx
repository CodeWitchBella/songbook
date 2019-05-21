import React, { PropsWithChildren } from 'react'
import { useSong } from 'store/store'
import styled from '@emotion/styled'
import { Link } from 'react-router-dom'
import { css } from '@emotion/core'
import useRouter from 'components/use-router'

const a = css`
  color: black;
  text-decoration: none;
  :hover {
    text-decoration: underline;
  }
`

const TheSong = styled.div`
  font-size: 20px;

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

export const SearchTitle = ({ children }: PropsWithChildren<{}>) => (
  <TheSong>
    <span className="title">{children}</span>
  </TheSong>
)

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

export const SongItem = ({ id }: { id: string }) => {
  const { song } = useSong({ id })
  if (!song) return null
  return (
    <TheSong>
      <LinkToSong id={song.slug}>
        {
          <>
            {song.title} - {song.author}
          </>
        }
        {/*window.location &&
          window.location.search.split(/[?&]/).includes('spotify')
            ? song.metadata.spotify !== null
              ? '🎵'
              : '🔇'
          : null*/}
      </LinkToSong>
    </TheSong>
  )
}

const columns = (n: number) => (p: { count: number }) => css`
  @media (min-width: ${n * 400}px) {
    grid-template-columns: repeat(${n}, 400px);
    grid-template-rows: repeat(${Math.ceil(p.count / n)}, auto);
  }
`

export const ListContainer = styled('div')<{ count: number }>`
  display: grid;
  grid-template-columns: repeat(1, 100%);
  grid-template-rows: repeat(
    ${props => Math.ceil(props.count / 1)},
    auto
  );

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
