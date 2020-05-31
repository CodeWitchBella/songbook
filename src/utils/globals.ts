/* eslint-disable no-underscore-dangle */

import * as globals from './globals-helper'

/* global FrameRequestCallback */

export const window = globals.window_
export function requestAnimationFrame(arg: FrameRequestCallback) {
  const raf = globals.requestAnimationFrame_ || ((a) => setTimeout(a, 0))
  raf((a) => {
    try {
      arg(a)
    } catch (e) {
      console.error('requestAnimationFrame:', e)
    }
  })
}
export const history = globals.history_
export const document = globals.document_
export const fetch = globals.fetch_
export const Headers = globals.Headers_
export const IntersectionObserver = globals.IntersectionObserver_
export const Raven = globals.Raven_
