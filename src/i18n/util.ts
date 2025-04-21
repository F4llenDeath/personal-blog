import { ui, defaultLang, showDefaultLang } from './ui'

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/')
  if (lang in ui) return lang as keyof typeof ui
  return defaultLang
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(
    key: keyof typeof ui[typeof defaultLang],
    vars?: Record<string, string>
  ) {
    const template = ui[lang][key] || ui[defaultLang][key]
    if (!vars) return template
    return Object.entries(vars).reduce(
      (str, [k, v]) => str.replaceAll(`{${k}}`, v),
      template as string
    )
  }
}

export function useTranslatedPath(lang: keyof typeof ui) {
  return function translatePath(path: string, l: string = lang) {
    return !showDefaultLang && l === defaultLang ? path : `/${l}${path}`
  }
}

export function formatLocalizedDate(date: string | Date, lang: string) {
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}