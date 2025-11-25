import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ko from './locales/ko.json'
import en from './locales/en.json'

const resources = {
  ko: { translation: ko },
  en: { translation: en }
}

i18n
  .use(LanguageDetector) // Detect browser language
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko', // Default to Korean if detection fails

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser
      caches: ['localStorage'], // Cache the language choice
      lookupLocalStorage: 'submarine-language' // Key for localStorage
    },

    interpolation: {
      escapeValue: false // React already escapes values
    },

    // Debug mode (disable in production)
    debug: false
  })

export default i18n
