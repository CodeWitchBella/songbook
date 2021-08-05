import { ChangelogEntry } from 'components/changelog-entry'
import { BackArrow, BackButton } from 'components/back-button'
import { View } from 'react-native'

import { useChangelog } from 'utils/use-changelog'
import { Fragment } from 'react'
import { RootView, TP, TText } from 'components/themed'
import { InlineLink } from 'components/interactive/inline-link'
import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createContext } from 'react'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from 'components/localisation'

function ChangelogBody() {
  const changelog = useChangelog()
  const [lng] = useLanguage()
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
          <ChangeBody body={lng === 'en' ? entry.en.body : entry.cz.body} />
        </ChangelogEntry>
      ))}
      <ChangelogEntry date="2016-08-03">
        <ChangeBody
          body={
            lng === 'en'
              ? `- Before web version there was LaTeX version
                 - Date is only a guess from memory, I did not version this in git
                 `.replace(/\n[ \t]+/g, '\n')
              : `- Před tímto zpěvníkem jsem měla systém založený na LaTeXu
                 - Datum je pouze odhad po paměti - toto jsem neukládala do gitu
                 `.replace(/\n[ \t]+/g, '\n')
          }
        />
      </ChangelogEntry>
      <View style={{ height: 16 }} />
    </>
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
    <View style={{ marginLeft: 8, marginTop: 4 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{ a: Link, text: TText, ul: Ul, li: Li, p: TP }}
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
  const { t } = useTranslation()
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
      <TText style={{ fontSize: 30, fontWeight: 'bold' }}>
        {t('Changelog')}
      </TText>
    </View>
  )
}
