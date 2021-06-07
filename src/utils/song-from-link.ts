import { getGraphqlUrl } from 'store/graphql'

export async function songFromLink(link: string): Promise<string | {}> {
  if (!link.startsWith('https://tabs.ultimate-guitar.com/tab/')) {
    return 'Jiné odkazy než ultimate guitar nejsou podporované'
  }
  const url = new URL('ultimate-guitar', getGraphqlUrl())
  url.searchParams.set('url', link)
  const res = await fetch(url.toString())
  const json = await res.json()
  const { title, author, text } = json
  if (!text) {
    console.warn(json)
    return 'Něco se pokazilo'
  }
  return { author, title, text: convertBody(text) }
}

function convertBody(text: string) {
  return text.replace(/\r\n/g, '\n')
}
