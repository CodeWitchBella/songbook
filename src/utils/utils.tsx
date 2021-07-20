import { useContext } from 'react'
import { createContext, useEffect, useState } from 'react'

export function once<T>(fn: () => T): () => T {
  let result: T
  let done = false
  return () => {
    if (!done) {
      done = true
      result = fn()
    }
    return result
  }
}

function prefixLength(a: string, b: string) {
  const length = Math.min(a.length, b.length)
  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) return i
  }
  return length
}

/**
 * Array.prototype.sort predicate which sorts alphabetically but sorts numbers
 * in reverse order
 */
export function collectionCompare(
  ai: { item: { name: string } },
  bi: { item: { name: string } },
) {
  const a = ai.item.name
  const b = bi.item.name
  const prefix = prefixLength(a, b)

  if (/[0-9]/.test(a[prefix]) && /[0-9]/.test(b[prefix])) {
    return b.localeCompare(a)
  }
  return a.localeCompare(b)
}

export function collectionFullName(collection: {
  slug: string
  owner: { handle?: string; name: string }
  name: string
}) {
  return (
    (collection.slug.includes('/')
      ? (collection.owner.handle || collection.owner.name) + ' > '
      : '') + collection.name
  )
}

export function useMediaQuery(query: string) {
  if (typeof window === 'undefined' || typeof window.matchMedia === 'undefined')
    return false

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [match, setMatch] = useState(!!window.matchMedia(query).matches)

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = () => setMatch(!!mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return !!match
}
