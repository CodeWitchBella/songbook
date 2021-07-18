/** @jsxImportSource @emotion/react */

import { BackArrow, BackButton, useGoBack } from 'components/back-button'
import { ErrorPage } from 'components/error-page'
import { LargeInput } from 'components/input'
import { BasicButton } from 'components/interactive/basic-button'
import { ListButton } from 'components/interactive/list-button'
import { useEffect } from 'react'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { useParams } from 'react-router-dom'
import { WithMethods } from 'store/generic-store'
import { graphqlFetch } from 'store/graphql'
import { useCollectionList, useSong, useViewer } from 'store/store'
import { CollectionType } from 'store/store-collections'
import { collectionCompare, collectionFullName } from 'utils/utils'

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
  const locked: typeof list = []
  for (const c of list) {
    const isInCollection = c.item.songList.includes(song.id)
    const editable = !c.item.locked && c.item.owner.name === viewer.name
    if (editable) {
      if (isInCollection) {
        removable.push(c)
      } else {
        addable.push(c)
      }
    } else if (isInCollection) {
      locked.push(c)
    }
  }

  return (
    <View
      style={{ justifyContent: 'center', paddingTop: 32, flexDirection: 'row' }}
    >
      <View style={{ maxWidth: 800 }}>
        {addable.length > 0 ? (
          <Title first={true} text="Přidat píseň do kolekce" error={error} />
        ) : null}
        <CollectionList
          list={addable.sort(collectionCompare)}
          onPress={(collectionId) => {
            setError('')
            addToCollection(song.id, collectionId).then(
              () => {
                refresh()
                goBack()
              },
              (err) => {
                setError('Něco se pokazilo')
                console.error(err)
              },
            )
          }}
        />
        {removable.length > 0 ? (
          <Title
            first={addable.length < 1}
            text="Odebrat píseň z kolekce"
            error={error}
          />
        ) : null}
        <CollectionList
          list={removable.sort(collectionCompare)}
          onPress={(collectionId) => {
            setError('')
            removeFromCollection(song.id, collectionId).then(
              () => {
                refresh()
                goBack()
              },
              (err) => {
                setError('Něco se pokazilo')
                console.error(err)
              },
            )
          }}
        />
        <Title
          first={addable.length < 1 && removable.length < 1}
          text="Vytvořit novou kolekci"
        />
        <NewCollection
          onDone={(collectionId) => {
            setError('')
            addToCollection(song.id, collectionId).then(
              () => {
                refresh()
                goBack()
              },
              (err) => {
                console.error(err)
                setError('Něco se pokazilo')
              },
            )
          }}
        />
        <Title first={false} text="Píseň je také v kolekcích" />
        <CollectionList list={locked.sort(collectionCompare)} />
      </View>
    </View>
  )
}

function Title({
  first,
  text,
  error,
}: {
  first: boolean
  text: string
  error?: string | null
}) {
  return (
    <>
      <View style={{ flexDirection: 'row', marginTop: 32 }}>
        {first ? (
          <BackButton>
            <BackArrow />
          </BackButton>
        ) : null}
        <Text style={{ fontSize: 24 }}>{text}</Text>
      </View>
      {error && first ? (
        <Text style={{ color: 'red', fontSize: 16, marginTop: 8 }}>
          {error}
        </Text>
      ) : null}
    </>
  )
}

function NewCollection({ onDone }: { onDone: (id: string) => void }) {
  const [name, setName] = useState('')
  const [disabled, setDisabled] = useState(false)
  const [error, setError] = useState('')
  const submit = (event: { preventDefault(): any }) => {
    event.preventDefault()
    if (disabled) return
    setDisabled(true)
    setError('')
    createCollection(name).then(
      (id) => {
        setDisabled(false)
        onDone(id)
      },
      (err) => {
        setDisabled(false)
        console.error(err)
        setError('Něco se pokazilo')
      },
    )
  }
  return (
    <form onSubmit={submit} css={{ fontSize: 16, marginTop: 16 }}>
      <LargeInput label="Název kolekce" value={name} onChange={setName} />
      <BasicButton
        disabled={disabled}
        style={{
          borderWidth: 1,
          paddingBottom: 6,
          paddingTop: 8,
          paddingHorizontal: 8,
        }}
        onPress={submit}
      >
        Vytvořit kolekci a přidat do ní píseň
      </BasicButton>
      {error ? (
        <Text style={{ color: 'red', fontSize: 16 }}>{error}</Text>
      ) : null}
      <button css={{ display: 'none' }} disabled={disabled} />
    </form>
  )
}

function CollectionList({
  list,
  onPress,
}: {
  list: readonly WithMethods<CollectionType>[]
  onPress?: (id: string) => void
}) {
  if (list.length < 1) return null
  return (
    <>
      {onPress
        ? list.map((item) => (
            <ListButton
              key={item.item.id}
              onPress={() => {
                onPress(item.item.id)
              }}
              style={{ marginTop: 8 }}
            >
              <Text>{collectionFullName(item.item)}</Text>
            </ListButton>
          ))
        : list.map((item) => (
            <Text key={item.item.id} style={{ marginTop: 8 }}>
              {collectionFullName(item.item)}
            </Text>
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

function createCollection(name: string): Promise<string> {
  return graphqlFetch({
    query: `mutation($name: String!) { createCollection(name: $name) { id } }`,
    variables: { name },
  }).then((v) => {
    const id = v.data.createCollection.id
    if (!id) {
      console.log(v)
      throw new Error('Failed to create collection')
    }
    return id
  })
}
