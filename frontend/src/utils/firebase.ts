import firebase from 'firebase/app'
import 'firebase/firestore'
import { useEffect } from 'react'
import { useSong } from 'store/store'
import { DateTime } from 'luxon'

firebase.initializeApp({
  apiKey: 'AIzaSyARWCQVqzRHKXIcNfkujzOvohDq_WhYStI',
  authDomain: 'songbook-240720.firebaseapp.com',
  databaseURL: 'https://songbook-240720.firebaseio.com',
  projectId: 'songbook-240720',
  storageBucket: 'songbook-240720.appspot.com',
  messagingSenderId: '481789658671',
  appId: '1:481789658671:web:177dc4ccc617b86f',
})

const firestore = firebase.firestore()

export function useAutoUpdatedSong(param: { slug: string } | { id: string }) {
  const ret = useSong(param)
  const id = ret.song ? ret.song.id : null
  const setRLM = ret.song ? ret.song.setRemoteLastModified : null
  useEffect(() => {
    if (id && setRLM) {
      return firestore.doc('songs/' + id).onSnapshot(snap => {
        const data = snap.data()
        if (!data || !data.lastModified) return
        setRLM(DateTime.fromJSDate(data.lastModified.toDate()).setZone('utc'))
      })
    } else {
      return undefined
    }
  }, [id, setRLM])
  return ret
}
