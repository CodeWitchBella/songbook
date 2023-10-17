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
  return (
    <div className="py-3">
      <h2 className="text-lg font-semibold">{formatDate(lng, date)}</h2>
      <div className="prose dark:prose-invert ">{children}</div>
    </div>
  )
}
