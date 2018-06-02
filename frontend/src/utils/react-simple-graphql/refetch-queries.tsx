import { Client, clientTag } from './client'

export default function refetchQueries(client: Client, queries: string[]) {
  const cache = client[clientTag].queries
  for (const key of Object.keys(cache)) {
    const state = cache[key]
    if (queries.includes(state.queryName)) {
      if (state.refetch) {
        state.refetch()
      } else {
        state.refetchScheduled = true
      }
    }
  }
}
