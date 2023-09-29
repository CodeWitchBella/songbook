import 'firebase/compat/firestore'

import firebase from 'firebase/compat/app'
import { DateTime } from 'luxon'
import { useEffect } from 'react'
import { useSong } from 'store/store'

function okHost() {
  if (window.location.protocol === 'http:') {
    if (window.location.host === 'localhost:3000') return true
  } else if (window.location.protocol === 'https:') {
    if (window.location.host === 'zpevnik.skorepova.info') return true
    if (window.location.host === 'songbook.now.sh') return true
    if (window.location.host.endsWith('.codewitchbella.now.sh')) return true
  }

  return false
}

function getFirestore() {
  if (!okHost()) {
    console.info('Live song updates are not available on this origin')
    return null
  }

  firebase.initializeApp({
    apiKey: 'AIzaSyARWCQVqzRHKXIcNfkujzOvohDq_WhYStI',
    authDomain: 'songbook-240720.firebaseapp.com',
    databaseURL: 'https://songbook-240720.firebaseio.com',
    projectId: 'songbook-240720',
    storageBucket: 'songbook-240720.appspot.com',
    messagingSenderId: '481789658671',
    appId: '1:481789658671:web:177dc4ccc617b86f',
  })
  return firebase.firestore()
}

const firestore = getFirestore()
;(window as any).firestore = firestore

export function useAutoUpdatedSong(param: { slug: string } | { id: string }) {
  const ret = useSong(param)
  const id = ret.song ? ret.song.id : null
  const setRLM = ret.methods ? ret.methods.setRemoteLastModified : null
  useEffect(() => {
    if (id && setRLM && firestore) {
      return firestore.doc('songs/' + id).onSnapshot((snap) => {
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
