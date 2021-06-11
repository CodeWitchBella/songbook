/** @jsxImportSource @emotion/react */

import { useCollectionList } from 'store/store'
import { useEffect } from 'react'
import { DateTime } from 'luxon'
import { BackButton, BackArrow } from 'components/back-button'
import { ListButton } from 'components/interactive/list-button'
import { View } from 'react-native'
import { useMemo } from 'react'

let lastRefreshThisRefresh: DateTime | null = null

export default function CollectionList() {
  const { list: unsortedList, refresh } = useCollectionList()
  useEffect(() => {
    if (
      !lastRefreshThisRefresh ||
      lastRefreshThisRefresh.plus({ hours: 1 }) < DateTime.utc()
    ) {
      lastRefreshThisRefresh = DateTime.utc()
      refresh()
    }
  }, [refresh])
  const sortedList = useMemo(
    () => [...unsortedList].sort(compare),
    [unsortedList],
  )
  return (
    <div css={{ minHeight: 'calc(100vh - 20px)', fontSize: 20, padding: 10 }}>
      <h2
        css={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BackButton>
          <BackArrow />
        </BackButton>{' '}
        Seznam kolekcí
      </h2>

      <View
        style={{
          flexDirection: 'column',
          marginHorizontal: 'auto',
        }}
      >
        <div>
          <ListButton to="/all-songs" style={{ borderWidth: 0 }}>
            Všechny písně
          </ListButton>
        </div>
        {sortedList.map(({ item: collection }) => (
          <div key={collection.id}>
            <Gap />
            <ListButton
              to={`/collections/${collection.slug}`}
              style={{ borderWidth: 0 }}
            >
              {(collection.slug.includes('/')
                ? (collection.owner.handle || collection.owner.name) + ' > '
                : '') + collection.name}
            </ListButton>
          </div>
        ))}
      </View>
    </div>
  )
}

function Gap() {
  return <View style={{ height: 5 }} />
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
function compare(
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
