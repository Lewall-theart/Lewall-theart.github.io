import React, { createContext, useContext, useEffect, useState } from 'react'

export type Language = 'vi' | 'en' | 'ja'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'vi',
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('vi')

  useEffect(() => {
    // 1. URL search param takes highest priority (?lang=en)
    const params = new URLSearchParams(window.location.search)
    const paramLang = params.get('lang') as Language
    // 2. localStorage saved preference
    const storedLang = (typeof window !== 'undefined' ? localStorage.getItem('preferred_blog_lang') : null) as Language

    const validLangs: Language[] = ['vi', 'en', 'ja']
    if (paramLang && validLangs.includes(paramLang)) {
      setLangState(paramLang)
    } else if (storedLang && validLangs.includes(storedLang)) {
      setLangState(storedLang)
    }
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    try {
      localStorage.setItem('preferred_blog_lang', newLang)
    } catch {}

    const url = new URL(window.location.href)
    if (newLang === 'vi') {
      url.searchParams.delete('lang')
    } else {
      url.searchParams.set('lang', newLang)
    }
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
