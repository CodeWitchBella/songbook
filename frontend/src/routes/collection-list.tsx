import { PageHeader } from 'components/page-header'
import { DateTime } from 'luxon'
import { useEffect } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCollectionList } from 'store/store'
import { collectionCompare, collectionFullName } from 'utils/utils'

let lastRefreshThisRefresh: DateTime | null = null

export default function CollectionList() {
  const { t } = useTranslation()
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
    () => [...unsortedList].sort(collectionCompare),
    [unsortedList],
  )
  return (
    <div className="mx-auto flex w-full max-w-max flex-col gap-4 px-4 pb-4">
      <PageHeader>{t('Collections')}</PageHeader>
      <Link to="/all-songs" className="hover:underline">
        {t('All songs')}
      </Link>
      {sortedList.map(({ item: collection }) => (
        <Link
          key={collection.id}
          to={`/collections/${collection.slug}`}
          className="hover:underline"
        >
          {collectionFullName(collection)}
        </Link>
      ))}
    </div>
  )
}
