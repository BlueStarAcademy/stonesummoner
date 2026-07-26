import type { LocaleId, LocaleMeta } from "./types";
import { LOCALE_IDS } from "./types";

export const LOCALE_META: Record<LocaleId, LocaleMeta> = {
  "ko": {
    "id": "ko",
    "htmlLang": "ko",
    "bcp47": "ko-KR",
    "nativeName": "한국어",
    "englishName": "Korean",
    "flagHint": "KR"
  },
  "en": {
    "id": "en",
    "htmlLang": "en",
    "bcp47": "en-US",
    "nativeName": "English",
    "englishName": "English",
    "flagHint": "US"
  },
  "ja": {
    "id": "ja",
    "htmlLang": "ja",
    "bcp47": "ja-JP",
    "nativeName": "日本語",
    "englishName": "Japanese",
    "flagHint": "JP"
  },
  "zh-Hans": {
    "id": "zh-Hans",
    "htmlLang": "zh-Hans",
    "bcp47": "zh-CN",
    "nativeName": "简体中文",
    "englishName": "Chinese (Simplified)",
    "flagHint": "CN"
  },
  "zh-Hant": {
    "id": "zh-Hant",
    "htmlLang": "zh-Hant",
    "bcp47": "zh-TW",
    "nativeName": "繁體中文",
    "englishName": "Chinese (Traditional)",
    "flagHint": "TW"
  },
  "de": {
    "id": "de",
    "htmlLang": "de",
    "bcp47": "de-DE",
    "nativeName": "Deutsch",
    "englishName": "German",
    "flagHint": "DE"
  },
  "fr": {
    "id": "fr",
    "htmlLang": "fr",
    "bcp47": "fr-FR",
    "nativeName": "Français",
    "englishName": "French",
    "flagHint": "FR"
  },
  "es": {
    "id": "es",
    "htmlLang": "es",
    "bcp47": "es-ES",
    "nativeName": "Español",
    "englishName": "Spanish",
    "flagHint": "ES"
  },
  "pt-BR": {
    "id": "pt-BR",
    "htmlLang": "pt-BR",
    "bcp47": "pt-BR",
    "nativeName": "Português (Brasil)",
    "englishName": "Portuguese (Brazil)",
    "flagHint": "BR"
  },
  "ru": {
    "id": "ru",
    "htmlLang": "ru",
    "bcp47": "ru-RU",
    "nativeName": "Русский",
    "englishName": "Russian",
    "flagHint": "RU"
  },
  "it": {
    "id": "it",
    "htmlLang": "it",
    "bcp47": "it-IT",
    "nativeName": "Italiano",
    "englishName": "Italian",
    "flagHint": "IT"
  },
  "th": {
    "id": "th",
    "htmlLang": "th",
    "bcp47": "th-TH",
    "nativeName": "ไทย",
    "englishName": "Thai",
    "flagHint": "TH"
  },
  "vi": {
    "id": "vi",
    "htmlLang": "vi",
    "bcp47": "vi-VN",
    "nativeName": "Tiếng Việt",
    "englishName": "Vietnamese",
    "flagHint": "VN"
  },
  "id": {
    "id": "id",
    "htmlLang": "id",
    "bcp47": "id-ID",
    "nativeName": "Bahasa Indonesia",
    "englishName": "Indonesian",
    "flagHint": "ID"
  },
  "ar": {
    "id": "ar",
    "htmlLang": "ar",
    "bcp47": "ar-SA",
    "nativeName": "العربية",
    "englishName": "Arabic",
    "flagHint": "SA",
    "rtl": true
  },
  "tr": {
    "id": "tr",
    "htmlLang": "tr",
    "bcp47": "tr-TR",
    "nativeName": "Türkçe",
    "englishName": "Turkish",
    "flagHint": "TR"
  },
  "pl": {
    "id": "pl",
    "htmlLang": "pl",
    "bcp47": "pl-PL",
    "nativeName": "Polski",
    "englishName": "Polish",
    "flagHint": "PL"
  },
  "nl": {
    "id": "nl",
    "htmlLang": "nl",
    "bcp47": "nl-NL",
    "nativeName": "Nederlands",
    "englishName": "Dutch",
    "flagHint": "NL"
  }
};

export function isLocaleId(value: string): value is LocaleId {
  return (LOCALE_IDS as readonly string[]).includes(value);
}

export { LOCALE_IDS };
