import { Readable } from 'stream'
import uuid from 'uuid/v4'
import { Firestore } from '@google-cloud/firestore'

/*
const containerURL = () => {
  const credential = new SharedKeyCredential(settings.account, settings.token)
  const pipeline = StorageURL.newPipeline(credential)

  const serviceURL = new ServiceURL(
    `https://${settings.account}.blob.core.windows.net`,
    pipeline,
  )
  return ContainerURL.fromServiceURL(serviceURL, 'songs')
}

function blobUrl(name: string) {
  const blobUrl = BlobURL.fromContainerURL(containerURL(), name)
  return BlockBlobURL.fromBlobURL(blobUrl)
}

export async function writeBlob(
  name: string,
  content: string,
  leaseId?: string,
) {
  const url = blobUrl(name)
  const stream = new Readable()
  stream._read = () => {}
  stream.push(content)
  stream.push(null)
  return uploadStreamToBlockBlob(Aborter.none, stream, url, 1024 * 1024, 1, {
    accessConditions: { leaseAccessConditions: { leaseId } },
  })
}

export async function rewriteBlob(name: string, content: string) {
  const url = blobUrl(name)
  let lease: undefined | Models.BlobAcquireLeaseResponse = undefined
  try {
    lease = await url.acquireLease(Aborter.none, uuid(), 30)
    if (!lease.leaseId) throw new Error('No lease acquired')
    await writeBlob(name, content, lease.leaseId)
    await url.releaseLease(Aborter.none, lease.leaseId)
  } catch (e) {
    // cleanup
    if (lease && lease.leaseId)
      await url.releaseLease(Aborter.none, lease.leaseId)

    if (e.body.Code === 'BlobNotFound')
      throw new Error('Cannot edit nonexistent song')
    throw e
  }
}
*/

const credentials = process.env.CREDENTIALS as any
const firestore = new Firestore({
  credentials,
  projectId: credentials.project_id,
})

export async function writeBlob(
  name: string,
  content: string,
  leaseId?: string,
) {
  const doc = await firestore
    .collection('songs')
    .where('slug', '==', 'Amazonka-Hop_Trop')
    .limit(1)
    .get()
  return doc.docs[0].data()
}
export async function rewriteBlob(name: string, content: string) {}
