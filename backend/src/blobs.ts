import {
  ContainerURL,
  ServiceURL,
  AnonymousCredential,
  StorageURL,
  Aborter,
  Models,
  BlobURL,
  BlockBlobURL,
  uploadStreamToBlockBlob,
  SharedKeyCredential,
} from '@azure/storage-blob'
import { Readable } from 'stream'

const settings = {
  token: process.env.TOKEN || '',
  account: 'songbook',
}

const containerURL = () => {
  const credential = new SharedKeyCredential(settings.account, settings.token)
  const pipeline = StorageURL.newPipeline(credential)

  const serviceURL = new ServiceURL(
    `https://${settings.account}.blob.core.windows.net`,
    pipeline,
  )
  return ContainerURL.fromServiceURL(serviceURL, 'songs')
}

export async function writeBlob(name: string, content: string) {
  const blobUrl = BlobURL.fromContainerURL(containerURL(), name)
  const url = BlockBlobURL.fromBlobURL(blobUrl)
  const stream = new Readable()
  stream._read = () => {}
  stream.push(content)
  stream.push(null)
  return uploadStreamToBlockBlob(Aborter.none, stream, url, 1024 * 1024, 1)
}
