import { PageHeader } from 'components/page-header'
import { useQueryParam } from 'components/use-router'
import React, { useMemo } from 'react'
import type { WithMethods } from 'store/generic-store'
import { graphqlFetch } from 'store/graphql'
import {
  useCollection,
  useCollectionList,
  usePagesNum,
  useSongList,
} from 'store/store'
import type { SongType } from 'store/store-song'
import { collectionCompare, collectionFullName } from 'utils/utils'

export default function CollectionDiff() {
  const { list: unsortedList } = useCollectionList()
  const sortedList = useMemo(
    () => [...unsortedList].sort(collectionCompare),
    [unsortedList],
  )
  const [a, setA] = useQueryParam('a')
  const [b, setB] = useQueryParam('b')
  const [ban, setBan] = useQueryParam('ban')
  return (
    <div className="px-2">
      <PageHeader>Diff</PageHeader>
      <div style={{ display: 'flex', gap: 16 }}>
        <label>
          Old:{' '}
          <select
            value={a ?? ''}
            onChange={(evt) => {
              setA(evt.currentTarget.value)
            }}
          >
            <option disabled value="">
              Choose collection
            </option>
            {sortedList.map(({ item }) => (
              <option key={item.id} value={item.slug}>
                {collectionFullName(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          New:{' '}
          <select
            value={b ?? ''}
            onChange={(evt) => {
              setB(evt.currentTarget.value)
            }}
          >
            <option disabled value="">
              Choose collection
            </option>
            {sortedList.map(({ item }) => (
              <option key={item.id} value={item.slug}>
                {collectionFullName(item)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ban:{' '}
          <select
            value={ban ?? ''}
            onChange={(evt) => {
              setBan(evt.currentTarget.value)
            }}
          >
            <option value="">None</option>
            {sortedList.map(({ item }) => (
              <option key={item.id} value={item.slug}>
                {collectionFullName(item)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {a && b ? <ActualDiff a={a} b={b} ban={ban} /> : null}
    </div>
  )
}

function ActualDiff({
  a: aSlug,
  b: bSlug,
  ban: banSlug,
}: {
  a: string
  b: string
  ban: string | null
}) {
  const { collection: a } = useCollection({ slug: aSlug })
  const { collection: ban } = useCollection({ slug: banSlug })
  const { collection: b, methods: methodsB } = useCollection({ slug: bSlug })
  const { songs: unsortedSongs } = useSongList()

  const songs = useMemo(() => unsortedSongs.sort(compareSongs), [unsortedSongs])

  function refresh() {
    methodsB?.refresh()
  }

  const sets = useMemo(() => {
    if (!a || !b) return null

    const aSet = new Set(a.songList)
    const bSet = new Set(b.songList)
    const banSet = new Set(ban?.songList ?? [])

    const added = new Set<string>()
    const removed = new Set<string>()
    const kept = new Set<string>()
    const neither = new Set<string>()
    const bad = new Set<string>()

    for (const {
      item: { id },
    } of songs) {
      const inA = aSet.has(id)
      const inB = bSet.has(id)
      if (banSet.has(id)) {
        if (inB) bad.add(id)
        else if (inA) removed.add(id)
      } else if (inA) {
        if (inB) kept.add(id)
        else removed.add(id)
      } else {
        if (inB) added.add(id)
        else neither.add(id)
      }
    }

    return { added, removed, kept, neither, b: bSet, a: aSet, bad }
  }, [a, b, ban, songs])

  const pagesNumA = usePagesNum(sets?.a ?? null)
  const pagesNumB = usePagesNum(sets?.b ?? null)

  if (!sets) return null
  return (
    <>
      <div style={{ marginTop: 16 }}>
        <div>
          Pages in old: {pagesNumA}, songs: {sets.a.size}
        </div>
        <div>
          Pages in new: {pagesNumB}, songs: {sets.b.size}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const id = getSongId(event)
            if (!id) return
            console.log(id, bSlug)
            removeFromCollection(id, bSlug).then(refresh)
          }}
        >
          <SongList
            songs={songs}
            set={sets.kept}
            title="Kept"
            actionTitle="X"
          />
        </form>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const id = getSongId(event)
            if (!id) return
            removeFromCollection(id, bSlug).then(refresh)
          }}
        >
          <SongList
            songs={songs}
            set={sets.added}
            title="Added"
            actionTitle="X"
          />
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            const id = getSongId(event)
            if (!id) return
            addToCollection(id, bSlug).then(refresh)
          }}
        >
          <SongList
            songs={songs}
            set={sets.removed}
            title="Removed"
            actionTitle="+"
          />{' '}
        </form>
        {sets.bad.size > 0 ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const id = getSongId(event)
              if (!id) return
              removeFromCollection(id, bSlug).then(refresh)
            }}
          >
            <SongList
              songs={songs}
              set={sets.bad}
              title="Banned but present"
              actionTitle="X"
            />
          </form>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault()
            const id = getSongId(event)
            if (!id) return
            addToCollection(id, bSlug).then(refresh)
          }}
        >
          <SongList
            songs={songs}
            set={sets.neither}
            title="In neither"
            actionTitle="+"
          />
        </form>
      </div>
    </>
  )
}

function getSongId(event: React.FormEvent<HTMLFormElement>) {
  return ((event.nativeEvent as any).submitter as HTMLElement).dataset['song']
}

function SongList({
  songs,
  set,
  title,
  actionTitle,
}: {
  songs: readonly WithMethods<SongType>[]
  set: Set<string>
  title: string
  actionTitle: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h2>{title}</h2>
      {songs.map(({ item: song }) =>
        set.has(song.id) ? (
          <div key={song.id}>
            <input
              type="submit"
              name="song"
              data-song={song.id}
              value={actionTitle}
            />
            {!song.author || !song.title
              ? song.author || song.title
              : `${song.title} - ${song.author}`}
          </div>
        ) : null,
      )}
    </div>
  )
}

function addToCollection(song: string, collection: string) {
  return graphqlFetch({
    query: `mutation($collection: String! $song: String!) { addToCollection(collection: $collection song: $song) }`,
    variables: { collection, song },
  })
}

function removeFromCollection(song: string, collection: string) {
  return graphqlFetch({
    query: `mutation($collection: String! $song: String!) { removeFromCollection(collection: $collection song: $song) }`,
    variables: { collection, song },
  })
}

function compareSongs(
  { item: a }: { item: SongType },
  { item: b }: { item: SongType },
) {
  const ret = a.title.localeCompare(b.title)
  if (ret !== 0) return ret
  return a.author.localeCompare(b.author)
}
