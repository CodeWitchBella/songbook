import latinize from 'latinize'

export function slugify(part: string) {
  return latinize(part)
    .replace(/[^a-z_0-9]/gi, ' ')
    .trim()
    .replace(/ +/g, '-')
    .toLowerCase()
}
export async function randomID(length: number) {
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
    ret += await randomID(length - ret.length)
  }
  return ret
}
