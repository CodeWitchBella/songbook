import { BackButton } from 'components/back-button'
import { useTranslation } from 'react-i18next'

import { RootView, TText } from './themed'

export function ErrorPage({
  text,
  children,
}: {
  text: string
  children?: JSX.Element
}) {
  const { t } = useTranslation()
  return (
    <RootView
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        top: 0,
        bottom: 0,
        position: 'absolute',
        left: 0,
        right: 0,
      }}
    >
      <TText style={{ fontSize: 42, textAlign: 'center' }}>{text}</TText>
      {children || null}
      <BackButton className="p-2">
        <TText style={{ fontSize: 22 }}>{t('Go back')}</TText>
      </BackButton>
    </RootView>
  )
}

export function NotFound() {
  const { t } = useTranslation()
  return <ErrorPage text={t('Page not found')} />
}
