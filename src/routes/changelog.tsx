/** @jsxImportSource @emotion/react */

import { ChangelogEntry } from 'components/changelog-entry'
import { BackArrow, BackButton } from 'components/back-button'
import { View } from 'react-native'

import { useChangelog } from 'utils/use-changelog'
import { Fragment } from 'react'
import { RootView, TText } from 'components/themed'
import { InlineLink } from 'components/interactive/inline-link'
import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createContext } from 'react'
import { useContext } from 'react'

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
        marginLeft: 16,
        marginVertical: 8,
      }}
    >
      {children}
    </TText>
  )
}

function Link({ href, children }: { href?: string; children: any }) {
  if (!href) return <TText>{children}</TText>
  return <InlineLink to={href}>{children}</InlineLink>
}

const depthCtx = createContext(0)
function Ul({ children, depth }: { children: any; depth: number }) {
  return (
    <depthCtx.Provider value={depth}>
      <View>{children.filter((child: any) => typeof child !== 'string')}</View>
    </depthCtx.Provider>
  )
}
function Li({ children }: { children: any }) {
  const depth = useContext(depthCtx)
  return (
    <View style={{ flexDirection: 'row' }}>
      <TText style={{ fontWeight: 'bold', marginRight: 4 }}>
        {depth === 1 ? '-' : '•'}{' '}
      </TText>
      <TText>{children}</TText>
    </View>
  )
}

function ChangeBody({ body }: { body: string }) {
  return (
    <View style={{ marginLeft: 32 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: Link, text: TText, ul: Ul, li: Li }}
      >
        {body}
      </ReactMarkdown>
    </View>
  )
}
export default function Changelog() {
  return (
    <RootView style={{ alignItems: 'center' }}>
      <View style={{ maxWidth: 800 }}>
        <Head />
        <ChangelogBody />
      </View>
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
        paddingLeft: 12,
      }}
    >
      <BackButton>
        <BackArrow />
      </BackButton>
      <TText style={{ fontSize: 30, fontWeight: 'bold' }}>Historie změn</TText>
    </View>
  )
}
