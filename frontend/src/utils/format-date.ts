import type { Language } from 'components/localisation'
import type { TFunction } from 'i18next'

// prettier-ignore
const months = {
  cs: [ 'ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince' ],
  en: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
}

export function formatDate(lng: Language, t: TFunction, date: string | null) {
  if (!date) return t('Invalid date')
  const parts = date.split(/[T-]/).map((n) => Number.parseInt(n, 10))
  return `${parts[2]}${lng === 'cs' ? '.' : ''} ${months[lng][parts[1] - 1]} ${
    parts[0]
  }`
}
