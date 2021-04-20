import fetch from 'node-fetch'
import type { APIGatewayProxyHandler } from 'aws-lambda'

export const handler: APIGatewayProxyHandler = async (event, context) => {
  try {
    const id = Number.parseInt(event.queryStringParameters?.id as any, 10)
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request' }),
      }
    }
    const r = await fetch(
      'https://www.ultimate-guitar.com/contribution/correct/create?id=' + id,
    )
    if (r.status !== 200) {
      return {
        statusCode: 424,
        body: JSON.stringify({ error: 'Cannot load from UG' }),
      }
    }
    const data = await r.text()

    const text = before(
      after(after(data, '<textarea id="js-tab-text"'), '>'),
      '</textarea>',
    )

    return {
      statusCode: 200,
      body: JSON.stringify({ text }),
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
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
