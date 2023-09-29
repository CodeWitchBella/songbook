import i18n from 'i18next'
import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'
import { useEffect } from 'react'
import { useReducer } from 'react'
import { I18nextProvider, initReactI18next } from 'react-i18next'

import cs from '../locales/translation-cs.json'
import en from '../locales/translation-en.json'

type Language = 'cs' | 'en'
const context = createContext<readonly [Language, (lng: Language) => void]>([
  'cs',
  () => {},
])

export function useLanguage() {
  return useContext(context)
}

function init() {
  return parseLanguage(localStorage.getItem('language'))
}

function parseLanguage(lng: string | null): Language {
  if (lng === 'en') return 'en'
  return 'cs'
}

function reducer(
  state: Language,
  lng: Language | ((l: Language) => Language),
): Language {
  return parseLanguage(typeof lng === 'function' ? lng(state) : lng)
}

export function LanguageProvider({ children }: PropsWithChildren<{}>) {
  const tuple = useReducer(reducer, undefined, init)
  const [lng, setLng] = tuple
  useEffect(() => {
    function listener(evt: StorageEvent) {
      if (evt.key !== 'language') return
      setLng(parseLanguage(evt.newValue))
    }
    window.addEventListener('storage', listener)
    return () => {
      window.removeEventListener('storage', listener)
    }
  }, [setLng])
  useEffect(() => {
    i18n.use(initReactI18next).init({
      resources: { en: { translation: en }, cs: { translation: cs } },
      fallbackLng: 'cs',
      interpolation: {
        escapeValue: false,
      },
      nsSeparator: '~',
    })
    ;(window as any)['setLng'] = setLng
    ;(window as any)['toggleLng'] = () => {
      setLng((prev) => (prev === 'en' ? 'cs' : 'en'))
    }
    return () => {
      delete (window as any)['setLng']
      delete (window as any)['toggleLng']
    }
  }, [setLng])
  useEffect(() => {
    i18n.changeLanguage(lng)
    if (lng === 'cs') localStorage.removeItem('language')
    else localStorage.setItem('language', lng)
  }, [lng])
  return (
    <I18nextProvider i18n={i18n}>
      <context.Provider value={tuple}>{children}</context.Provider>
    </I18nextProvider>
  )
}
