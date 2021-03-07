import React, { useEffect } from 'react'
import Song from '../sections/song/song'
import { ScrollToTopOnMount } from '../components/scroll'
import { errorBoundary } from '../containers/error-boundary'

const SongRoute = ({ slug }: { slug: string }) => {
  useWakeLock()
  return (
    <main>
      <ScrollToTopOnMount />
      <Song slug={slug} enableMenu />
    </main>
  )
}

function useWakeLock() {
  useEffect(() => {
    if ('wakeLock' in navigator) {
      let wakeLock: Promise<any> | null = (navigator as any).wakeLock.request(
        'screen',
      )
      const handleVisibilityChange = () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
          wakeLock.then((lock) => lock.release())
          wakeLock = (navigator as any).wakeLock.request('screen')
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      document.addEventListener('fullscreenchange', handleVisibilityChange)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        document.removeEventListener('fullscreenchange', handleVisibilityChange)
        wakeLock?.then((lock) => lock.release())
        wakeLock = null
      }
    }
    return undefined
  }, [])
}

export default errorBoundary(SongRoute)
