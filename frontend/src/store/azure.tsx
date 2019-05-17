import {
  ContainerURL,
  ServiceURL,
  AnonymousCredential,
  StorageURL,
  Aborter,
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
export function downloadSong(id: string): ReturnType<typeof downloadSongImpl> {
  promise = pfinally(promise, () => downloadSongImpl(id))
  return promise
}
