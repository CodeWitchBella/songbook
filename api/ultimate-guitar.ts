import type { VercelRequest, VercelResponse } from '@vercel/node'
import fetch from 'node-fetch'

export default async function ultimateGuitar(
  request: VercelRequest,
  response: VercelResponse,
) {
  try {
    const id = Number.parseInt(request.query.id as any, 10)
    if (!id) {
      response.status(400).send(JSON.stringify({ error: 'Invalid request' }))
      return
    }
    const r = await fetch(
      'https://www.ultimate-guitar.com/contribution/correct/create?id=' + id,
    )
    if (r.status !== 200) {
      response
        .status(424)
        .send(JSON.stringify({ error: 'Cannot load from UG' }))
      return
    }
    const data = await r.text()

    const text = before(
      after(after(data, '<textarea id="js-tab-text"'), '>'),
      '</textarea>',
    )

    response.status(200).send(JSON.stringify({ text }))
    return
  } catch (e) {
    response
      .status(500)
      .send(JSON.stringify({ error: 'Internal server error' }))
  }
}

function after(text: string, delimiter: string) {
  const index = text.indexOf(delimiter)
  if (index < 0) return ''
  return text.substring(index + delimiter.length)
}

function before(text: string, delimiter: string) {
  const index = text.indexOf(delimiter)
  if (index < 0) return ''
  return text.substring(0, index)
}
