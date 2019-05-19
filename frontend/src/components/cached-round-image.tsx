/** @jsx jsx */
import { jsx } from '@emotion/core'
import { useState, useEffect, useLayoutEffect } from 'react'
import { createInstance } from 'localforage'

const imageCache = createInstance({ name: 'imagecache' })

function useImageCache(srcUrl: string) {
  const [blob, setBlob] = useState<null | Blob>(null)

  useEffect(() => {
    imageCache
      .getItem<Blob>(srcUrl)
      .then(blob => {
        if (blob) {
          return blob
        } else {
          return fetch(srcUrl).then(r => r.blob())
        }
      })
      .then(blob => setBlob(blob))
      .catch(e => setBlob(null))
  }, [srcUrl])

  const [url, setUrl] = useState<string | null>(null)

  useLayoutEffect(() => {
    if (blob) {
      const v = window.URL.createObjectURL(blob)
      setUrl(v)
      return () => window.URL.revokeObjectURL(v)
    } else {
      setUrl(null)
      return undefined
    }
  }, [blob])

  return url
}

export function CachedRoundImage({
  src,
}: {
  src: { url: string; width: number; height: number }
}) {
  const cached = useImageCache(src.url)
  const style = {
    width: src.width,
    height: src.height,
    background: '#aaa',
    borderRadius: Math.min(src.width, src.height) / 2,
  }
  if (!cached) return <div css={style} />
  return <img src={cached} alt="" css={style} />
}
