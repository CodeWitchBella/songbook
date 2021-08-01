/** @jsxImportSource @emotion/react */

import { BackArrow, BackButton, useGoBack } from 'components/back-button'
import { ErrorPage } from 'components/error-page'
import { LargeInput } from 'components/input'
import { BasicButton } from 'components/interactive/basic-button'
import { ListButton } from 'components/interactive/list-button'
import { RootView, TText } from 'components/themed'
import { useEffect } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useParams } from 'react-router-dom'
import { WithMethods } from 'store/generic-store'
import { graphqlFetch } from 'store/graphql'
import { useCollectionList, useSong, useViewer } from 'store/store'
import { CollectionType } from 'store/store-collections'
import { collectionCompare, collectionFullName } from 'utils/utils'

export default function AddToCollection() {
  const { t } = useTranslation()
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

  const addable: typeof list = []
  const removable: typeof list = []
  const locked: typeof list = []
  for (const c of list) {
    const isInCollection = c.item.songList.includes(song.id)
    const editable = !c.item.locked && c.item.owner.name === viewer?.name
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

  if (!viewer) {
    return (
      <RootView
        style={{
          justifyContent: 'center',
          paddingTop: 32,
          flexDirection: 'row',
        }}
      >
        <View>
          <Title
            text="Pro přidání písně do kolekce musíš mít účet."
            first={true}
          />
          <View style={{ paddingTop: 16 }} />
          <ListButton to="/login">Přihlásit se</ListButton>
          <View style={{ paddingTop: 8 }} />
          <ListButton to="/register">Vytvořit účet</ListButton>
          {locked.length > 0 ? (
            <Title text="Píseň je v kolekcích" first={false} />
          ) : null}
          <CollectionList list={locked.sort(collectionCompare)} />
        </View>
      </RootView>
    )
  }

  return (
    <RootView
      style={{ justifyContent: 'center', paddingTop: 32, flexDirection: 'row' }}
    >
      <View style={{ maxWidth: 800 }}>
        {addable.length > 0 ? (
          <Title
            first={true}
            text={t('collection.Add song to collection')}
            error={error}
          />
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
            text={t('collection.Remove song from collection')}
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
                setError(t('Something went wrong'))
                console.error(err)
              },
            )
          }}
        />
        <Title
          first={addable.length < 1 && removable.length < 1}
          text={t('collection.Create new collection')}
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
                setError(t('Something went wrong'))
              },
            )
          }}
        />
        {locked.length > 0 ? (
          <Title
            first={false}
            text={t('collection.Song is also in collections')}
          />
        ) : null}
        <CollectionList list={locked.sort(collectionCompare)} />
      </View>
    </RootView>
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
        <TText style={{ fontSize: 24 }}>{text}</TText>
      </View>
      {error && first ? (
        <TText style={{ color: 'red', fontSize: 16, marginTop: 8 }}>
          {error}
        </TText>
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
        setError(t('Something went wrong'))
      },
    )
  }
  const { t } = useTranslation()
  return (
    <form onSubmit={submit} css={{ fontSize: 16, marginTop: 16 }}>
      <LargeInput
        label={t('collection.Collection name')}
        value={name}
        onChange={setName}
      />
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
        {t('collection.Create collection and add song to it')}
      </BasicButton>
      {error ? (
        <TText style={{ color: 'red', fontSize: 16 }}>{error}</TText>
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
              <TText>{collectionFullName(item.item)}</TText>
            </ListButton>
          ))
        : list.map((item) => (
            <TText key={item.item.id} style={{ marginTop: 8 }}>
              {collectionFullName(item.item)}
            </TText>
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
