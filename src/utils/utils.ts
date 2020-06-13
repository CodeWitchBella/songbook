export function once<T>(fn: () => T): () => T {
  let result: T
  let done = false
  return () => {
    if (!done) {
      done = true
      result = fn()
    }
    return result
  }
}
