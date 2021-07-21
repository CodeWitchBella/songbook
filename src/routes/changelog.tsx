/** @jsxImportSource @emotion/react */

import { ChangelogEntry } from 'components/changelog-entry'
import { BackArrow, BackButton } from 'components/back-button'
import { View } from 'react-native'

import { useChangelog } from 'utils/use-changelog'
import { Fragment } from 'react'
import { RootView, TText } from 'components/themed'
import { InlineLink } from 'components/interactive/inline-link'

function ChangelogBody() {
  const changelog = useChangelog()
  if (changelog.status === 'initializing') return null

  if (changelog.status === 'loading') {
    return <TText>Načítám...</TText>
  }
  if (changelog.status === 'error') {
    return <TText>Načítání selhalo.</TText>
  }
  return (
    <>
      {changelog.data.map((entry) => (
        <ChangelogEntry key={entry.cz.tagName} date={entry.cz.tagName.slice(1)}>
          <LangTitle first>Česky</LangTitle>
          <ChangeBody body={entry.cz.body} />
          <LangTitle first={false}>English</LangTitle>
          <ChangeBody body={entry.en.body} />
        </ChangelogEntry>
      ))}
    </>
  )
}

function LangTitle({ children, first }: { children: string; first: boolean }) {
  return (
    <TText
      style={{
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: -32,
        marginTop: first ? 0 : 30,
      }}
    >
      {children}
    </TText>
  )
}

function ChangeBody({ body }: { body: string }) {
  const items = []
  let prevLines: JSX.Element[] = []
  let key = 0
  for (const line of body.split('\n').reverse()) {
    if (line.startsWith('- ')) {
      items.push(
        <li key={key++}>
          <TText>
            <Linkified line={line.substring(2)} />
            {prevLines.length >= 1 ? (
              <ul key={key++}>{prevLines.reverse()}</ul>
            ) : null}
          </TText>
        </li>,
      )
      prevLines = []
    } else {
      const subbullet = /^ +- /
      if (line.match(subbullet)) {
        prevLines.push(
          <li key={key++}>
            <Linkified line={line.replace(subbullet, '')} />
          </li>,
        )
      } else {
        prevLines.push(<Linkified key={key++} line={line} />)
      }
    }
  }
  return <>{items.reverse()}</>
}

function Linkified({ line }: { line: string }) {
  let match: RegExpMatchArray | null = null
  const res: (JSX.Element | string)[] = []
  let key = 0
  while (
    line &&
    (match = line.match(/\[([^\]]+)\]\(([^)]+)\)/)) &&
    typeof match.index === 'number'
  ) {
    if (!match) continue
    const pre = line.substring(0, match.index)
    const text = match[1]
    const link = match[2]
    line = line.substring(match.index + text.length + link.length + 4)
    res.push(<Fragment key={key++}>{pre}</Fragment>)
    res.push(
      <InlineLink to={link} key={key++}>
        {text}
      </InlineLink>,
    )
  }
  res.push(<Fragment key={key++}>{line}</Fragment>)
  return <>{res}</>
}

export default function Changelog() {
  return (
    <RootView>
      <Head />
      <ChangelogBody />
    </RootView>
  )
}

function Head() {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        padding: 16,
        paddingBottom: 4,
        paddingTop: 24,
      }}
    >
      <BackButton>
        <BackArrow />
      </BackButton>
      <TText style={{ fontSize: 30, fontWeight: 'bold' }}>Historie změn</TText>
    </View>
  )
}
