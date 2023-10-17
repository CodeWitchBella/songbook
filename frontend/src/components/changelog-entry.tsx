import { useTranslation } from 'react-i18next'
import { formatDate } from 'utils/format-date'

import { useLanguage } from './localisation'

export function ChangelogEntry({
  date,
  children,
}: {
  date: string
  children: null | JSX.Element | readonly JSX.Element[]
}) {
  const [lng] = useLanguage()
  const { t } = useTranslation()
  return (
    <div className="py-3">
      <h2 className="text-lg font-semibold">{formatDate(lng, t, date)}</h2>
      <div className="prose dark:prose-invert ">{children}</div>
    </div>
  )
}
