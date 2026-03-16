import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import en_US from "./locales/en_US.json"
import zh_CN from "./locales/zh_CN.json"

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    detection:{
      order: ["querystring", "cookie", "localStorage", "navigator", "htmlTag"],
      lookupQuerystring: "lng",
      lookupCookie: "i18next",
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage", "cookie"],
      cookieMinutes: 10,
    },
    resources: {
      en_US: { translation: en_US },
      zh_CN: { translation: zh_CN }
    },
    fallbackLng: "en_US",
    interpolation: {
      escapeValue: false
    }
  })

export default i18n