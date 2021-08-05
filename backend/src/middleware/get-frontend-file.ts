import path from 'path'
import { promisify } from 'util'
import fs from 'fs'
import request from 'request'
import settings from '../settings'
import * as pkg from '../package-json'

const frontendPath = path.resolve(__dirname, '..', '..', '..', 'frontend')

export default async function getFrontendFile<T extends string | null>(
  fname: string,
  ssr: boolean,
  encoding: T,
): Promise<(T extends string ? string : Buffer) | false> {
  try {
    if (settings.serveStatic) {
      const file = path.join(
        frontendPath,
        ssr ? 'dist-ssr' : 'dist',
        fname.replace('/dist/', '/'),
      )
      const data = await promisify(fs.readFile)(file, encoding)
      return data as any
    }

    const url = `http://localhost${
      ssr ? ':4001' : ':4000'
    }${fname}`
    const response = (await promisify(request)(
      {
        url,
        encoding,
      },
      undefined,
    )) as request.RequestResponse
    if (!response || response.statusCode !== 200 || !response.body) {
      console.log(response.toJSON())
      return false
    }

    return response.body
  } catch (e) {
    console.log(e)
  }
  return false
}
