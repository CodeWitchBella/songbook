import { createContext, PropsWithChildren, useContext, useState } from 'react'
import i18n from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { useEffect } from 'react'

import en from '../locales/translation-en.json'
import cs from '../locales/translation-cs.json'

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

export function LanguageProvider({ children }: PropsWithChildren<{}>) {
  const tuple = useState(init)
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
    })
  }, [])
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
