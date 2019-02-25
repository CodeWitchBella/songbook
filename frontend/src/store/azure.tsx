import {
  ContainerURL,
  ServiceURL,
  AnonymousCredential,
  StorageURL,
  Aborter,
  Models,
  BlobURL,
} from '@azure/storage-blob'

const settings = { account: 'songbook' }

const containerURL = (() => {
  const anonymousCredential = new AnonymousCredential()
  const pipeline = StorageURL.newPipeline(anonymousCredential)

  const serviceURL = new ServiceURL(
    `https://${settings.account}.blob.core.windows.net`,
    pipeline,
  )
  return ContainerURL.fromServiceURL(serviceURL, 'songs')
})()

export async function listSongs() {
  const list = [] as { name: string; lastModified: number }[]
  let marker: string | undefined = undefined
  do {
    type Resp = Models.ContainerListBlobFlatSegmentResponse
    const resp: Resp = await containerURL.listBlobFlatSegment(
      Aborter.none,
      marker,
    )

    marker = resp.nextMarker
    for (const blob of resp.segment.blobItems) {
      list.push({
        name: blob.name,
        lastModified: blob.properties.lastModified.getTime(),
      })
    }
  } while (marker)
  return list
}

async function downloadSongImpl(name: string) {
  const blobURL = BlobURL.fromContainerURL(containerURL, name)
  const resp = await blobURL.download(Aborter.none, 0)
  const blob = await resp.blobBody!
  const reader = new FileReader()
  reader.readAsText(blob, 'utf8')
  return new Promise<{ lastModified: number; text: string }>(
    (resolve, reject) => {
      reader.onload = () => {
        resolve({
          text: reader.result as string,
          lastModified: resp.lastModified!.getTime(),
        })
      }
      reader.onerror = reject
    },
  )
}

function pfinally<T extends {}>(
  p: Promise<any>,
  fn: () => Promise<T>,
): Promise<T> {
  return p.then(fn).catch(fn)
}

let promise = Promise.resolve<any>(null)
export function downloadSong(
  name: string,
): ReturnType<typeof downloadSongImpl> {
  promise = pfinally(promise, () => downloadSongImpl(name))
  return promise
}
