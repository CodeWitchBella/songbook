import { song } from '../db/schema.js'
import type { MyContext } from '../lib/context.js'
import { checkCode } from '../lib/drizzle.js'
import { validateJsonBody } from '../lib/request.js'
import {
  badRequestResponse,
  jsonResponse,
  methodNotAllowedResponse,
} from '../lib/response.js'
import { getViewerCheck } from '../lib/graphql-server-config.js'
import { slugify } from '../lib/utils.js'

export async function handleCreateSong(request: Request, context: MyContext) {
  const { viewer } = await getViewerCheck(context)
  if (request.method !== 'POST') return methodNotAllowedResponse()
  const input = await validateJsonBody(request, {
    required: ['title', 'author'],
    optional: ['text', 'extraNonSearchable'],
  })

  const slug = slugify(`${input.title}-${input.author}`)
  try {
    await context.db.insert(song).values({
      text: input.text || '',
      slug,
      editor: viewer.id,
      author: input.author,
      title: input.title,
    })
  } catch (e) {
    if (checkCode(e, 'ER_DUP_ENTRY'))
      return badRequestResponse('Song already exists')
    throw e
  }

  return jsonResponse({ slug })
}
