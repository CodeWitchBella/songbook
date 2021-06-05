import { RavenStatic } from 'raven-js'

/* eslint-disable no-underscore-dangle */
export const window_ = typeof window !== 'undefined' ? window : null
export const requestAnimationFrame_ = (
  typeof requestAnimationFrame !== 'undefined'
    ? requestAnimationFrame
    : // we have polyfill, eat it on ssr
      () => {}
) as typeof requestAnimationFrame
// eslint-disable-next-line no-restricted-globals
export const history_ = typeof history !== 'undefined' ? history : null
export const document_ = typeof document !== 'undefined' ? document : null
export const fetch_ = typeof fetch !== 'undefined' ? fetch : null
export const Headers_ =
  typeof Headers !== 'undefined' ? Headers : function Headers() {}
export const IntersectionObserver_ =
  typeof IntersectionObserver !== 'undefined' ? IntersectionObserver : null
export const Raven_ =
  window_ && typeof (window_ as any).Raven !== 'undefined'
    ? ((window_ as any).Raven as RavenStatic)
    : null
