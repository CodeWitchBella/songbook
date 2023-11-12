import {
  useBootstrap,
  useDocument,
  useLocalAwareness,
  useRemoteAwareness,
} from '@automerge/automerge-repo-react-hooks'
import { Buffer } from 'buffer'

function randomID(length: number) {
  const bytes = crypto.getRandomValues(
    new Uint8Array(Math.ceil((length / 3) * 2) + 1 + 3),
  )
  if (!bytes) throw new Error('Could not generate random bytes')
  let ret = Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .slice(0, length)
    .replace(/=/g, '')
  while (ret.length < length) {
    ret += randomID(length - ret.length)
  }
  return ret
}

const userId = (window as any).userId ?? randomID(20)
;(window as any).userId = userId

export default function AutomergePlayground() {
  const handle = useBootstrap()
  const [doc, changeDoc] = useDocument(handle.url)

  const [localState, updateLocalState] = useLocalAwareness({
    handle,
    userId,
    initialState: {},
  })

  const [peerStates, heartbeats] = useRemoteAwareness({
    handle,
    localUserId: userId,
  })

  const newCount = localState?.count
  const count = doc?.count ?? 0

  return (
    <div>
      <div>
        Ephemeral state:
        <input
          type="number"
          value={newCount ?? count}
          placeholder={count}
          style={{ color: newCount ? 'red' : 'black' }}
          onChange={(e) =>
            updateLocalState((state: any) => ({
              ...state,
              count: e.target.value,
            }))
          }
        />
      </div>
      <div>
        Doc state:
        <span children={count} className="mx-2 bg-slate-300 p-2 text-black" />
      </div>
      <div>
        Peer states:
        {Object.entries(peerStates).map(
          ([peerId, { count } = { count: undefined }]) => (
            <span
              key={peerId}
              style={{ backgroundColor: 'silver', marginRight: '2px' }}
            >
              {peerId}: {count ?? '🤷‍♀️'}
            </span>
          ),
        )}
      </div>
      <br />
      <div className="flex gap-2">
        <button
          className="flex items-center justify-center rounded border border-current px-4 py-2"
          onClick={() =>
            changeDoc((doc: any) => {
              if (newCount === undefined) return
              doc.count = newCount
              updateLocalState((state: any) => ({ ...state, count: undefined }))
            })
          }
          disabled={newCount === undefined}
          children="commit to doc"
        />
        <button
          className="flex items-center justify-center rounded border border-current px-4 py-2"
          onClick={() =>
            updateLocalState((state: any) => ({ ...state, count: undefined }))
          }
          disabled={newCount === undefined}
          children="reset"
        />
      </div>
      <pre>
        {JSON.stringify({ doc, localState, peerStates, heartbeats }, null, 2)}
      </pre>
    </div>
  )
}
