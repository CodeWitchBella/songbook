import type { Language } from 'components/localisation'

// prettier-ignore
const months = {
  cs: [ 'ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince' ],
  en: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
}

export function formatDate(lng: Language, date: string) {
  const parts = date.split('-').map((n) => Number.parseInt(n, 10))
  return `${parts[2]}${lng === 'cs' ? '.' : ''} ${months[lng][parts[1] - 1]} ${
    parts[0]
  }`
}
