import { BackButton } from 'components/back-button'
import { useTranslation } from 'react-i18next'

import { TText } from './themed'

export function ErrorPage({
  text,
  children,
}: {
  text: string
  children?: JSX.Element
}) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center">
      <TText style={{ fontSize: 42, textAlign: 'center' }}>{text}</TText>
      {children || null}
      <BackButton className="p-2">
        <TText style={{ fontSize: 22 }}>{t('Go back')}</TText>
      </BackButton>
    </div>
  )
}

export function NotFound() {
  const { t } = useTranslation()
  return <ErrorPage text={t('Page not found')} />
}
