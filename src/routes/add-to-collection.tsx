/** @jsxImportSource @emotion/react */

import { BackArrow, BackButton, useGoBack } from 'components/back-button'
import { ErrorPage } from 'components/error-page'
import { ListButton } from 'components/interactive/list-button'
import { useEffect } from 'react'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { useParams } from 'react-router-dom'
import { WithMethods } from 'store/generic-store'
import { graphqlFetch } from 'store/graphql'
import { useCollectionList, useSong, useViewer } from 'store/store'
import { CollectionType } from 'store/store-collections'

export default function AddToCollection() {
  const { refresh, list } = useCollectionList()
  const params = useParams<{ slug: string }>()
  const { song } = useSong({ slug: params.slug })
  const [viewer] = useViewer()
  const [error, setError] = useState('')
  const goBack = useGoBack()

  useEffect(() => {
    refresh()
  }, [refresh])

  if (!song) {
    return <ErrorPage text="Píseň nenalezena." />
  }
  if (!viewer) {
    return <ErrorPage text="Pro přidání písně do kolekce musíš mít účet." />
  }

  const addable: typeof list = []
  const removable: typeof list = []
  for (const c of list) {
    if (c.item.locked) continue
    if (c.item.owner.name !== viewer.name) continue

    if (c.item.songList.includes(song.id)) {
      removable.push(c)
    } else {
      addable.push(c)
    }
  }

  if (addable.length < 1 && removable.length < 1) {
    return (
      <ErrorPage text="Neexistuje žádná kolekce, kterou můžeš editovat">
        <Text style={{ fontSize: 18 }}>
          Vytváření nových kolekcí není v současné době možné
        </Text>
      </ErrorPage>
    )
  }

  return (
    <View
      style={{ justifyContent: 'center', paddingTop: 32, flexDirection: 'row' }}
    >
      <View style={{ maxWidth: 800 }}>
        <CollectionList
          list={addable}
          error={error}
          onPress={(collectionId) => {
            setError('')
            addToCollection(song.id, collectionId)
              .then(refresh)
              .then(
                () => {
                  goBack()
                },
                (err) => {
                  setError('Něco se pokazilo')
                  console.error(err)
                },
              )
          }}
        />
        <CollectionList
          list={removable}
          error={error}
          showBack={addable.length < 1}
          onPress={(collectionId) => {
            setError('')
            removeFromCollection(song.id, collectionId)
              .then(refresh)
              .then(
                () => {
                  goBack()
                },
                (err) => {
                  setError('Něco se pokazilo')
                  console.error(err)
                },
              )
          }}
        />
      </View>
    </View>
  )
}

function CollectionList({
  error,
  list,
  onPress,
  showBack = true,
}: {
  error: string
  list: readonly WithMethods<CollectionType>[]
  onPress: (id: string) => void
  showBack?: boolean
}) {
  if (list.length < 1) return null
  return (
    <>
      <View style={{ flexDirection: 'row', marginTop: 32 }}>
        {showBack ? (
          <BackButton>
            <BackArrow />
          </BackButton>
        ) : null}
        <Text style={{ fontSize: 24 }}>Přidat píseň do kolekce</Text>
      </View>
      {error ? (
        <Text style={{ color: 'red', fontSize: 16 }}>{error}</Text>
      ) : null}
      {list.map((item) => (
        <ListButton
          key={item.item.id}
          onPress={() => {
            onPress(item.item.id)
          }}
          style={{ marginTop: 8 }}
        >
          <Text>{item.item.name}</Text>
        </ListButton>
      ))}
    </>
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
