import { isLocaleId, LOCALE_META } from "./locales";
import type { LocaleId } from "./types";

/** ISO country / region code → preferred game locale. */
const COUNTRY_TO_LOCALE: Record<string, LocaleId> = {
  KR: "ko",
  KP: "ko",
  JP: "ja",
  CN: "zh-Hans",
  SG: "zh-Hans",
  TW: "zh-Hant",
  HK: "zh-Hant",
  MO: "zh-Hant",
  DE: "de",
  AT: "de",
  CH: "de",
  FR: "fr",
  BE: "fr",
  LU: "fr",
  ES: "es",
  MX: "es",
  AR: "es",
  CL: "es",
  CO: "es",
  PE: "es",
  BR: "pt-BR",
  PT: "pt-BR",
  RU: "ru",
  BY: "ru",
  KZ: "ru",
  IT: "it",
  TH: "th",
  VN: "vi",
  ID: "id",
  SA: "ar",
  AE: "ar",
  EG: "ar",
  IQ: "ar",
  JO: "ar",
  KW: "ar",
  QA: "ar",
  BH: "ar",
  OM: "ar",
  MA: "ar",
  DZ: "ar",
  TN: "ar",
  TR: "tr",
  PL: "pl",
  NL: "nl",
  US: "en",
  GB: "en",
  AU: "en",
  CA: "en",
  NZ: "en",
  IE: "en",
  PH: "en",
  IN: "en",
  MY: "en",
};

/** IANA timezone → country hint when browser language is missing / unsupported. */
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Asia/Seoul": "KR",
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Asia/Chongqing": "CN",
  "Asia/Harbin": "CN",
  "Asia/Urumqi": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Macau": "MO",
  "Asia/Taipei": "TW",
  "Asia/Singapore": "SG",
  "Asia/Bangkok": "TH",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Saigon": "VN",
  "Asia/Jakarta": "ID",
  "Asia/Makassar": "ID",
  "Asia/Jayapura": "ID",
  "Asia/Riyadh": "SA",
  "Asia/Dubai": "AE",
  "Asia/Istanbul": "TR",
  "Europe/Berlin": "DE",
  "Europe/Vienna": "AT",
  "Europe/Zurich": "CH",
  "Europe/Paris": "FR",
  "Europe/Brussels": "BE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
  "Europe/Warsaw": "PL",
  "Europe/Moscow": "RU",
  "Europe/London": "GB",
  "Europe/Dublin": "IE",
  "America/Sao_Paulo": "BR",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Mexico_City": "MX",
  "America/Buenos_Aires": "AR",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Pacific/Auckland": "NZ",
};

function normalizeTag(tag: string): string {
  return tag.trim().replace(/_/g, "-");
}

/** Map a BCP-47 / Accept-Language tag onto a supported locale. */
export function localeFromLanguageTag(tag: string): LocaleId | null {
  const raw = normalizeTag(tag);
  if (!raw) return null;
  if (isLocaleId(raw)) return raw;

  const lower = raw.toLowerCase();
  if (lower === "zh-cn" || lower === "zh-sg" || lower === "zh-hans" || lower.startsWith("zh-hans")) {
    return "zh-Hans";
  }
  if (
    lower === "zh-tw" ||
    lower === "zh-hk" ||
    lower === "zh-mo" ||
    lower === "zh-hant" ||
    lower.startsWith("zh-hant")
  ) {
    return "zh-Hant";
  }
  if (lower === "zh") return "zh-Hans";
  if (lower.startsWith("pt")) return "pt-BR";

  const primary = lower.split("-")[0] ?? "";
  if (isLocaleId(primary)) return primary;
  if (primary === "nb" || primary === "nn") return "en";
  return null;
}

export function localeFromCountryCode(country: string | null | undefined): LocaleId | null {
  if (!country) return null;
  const code = country.trim().toUpperCase();
  return COUNTRY_TO_LOCALE[code] ?? null;
}

export function guessCountryFromTimezone(timeZone?: string): string | null {
  const tz =
    timeZone ||
    (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        return "";
      }
    })();
  if (!tz) return null;
  return TIMEZONE_TO_COUNTRY[tz] ?? null;
}

/**
 * Default locale for a first-time visitor:
 * 1) browser language list
 * 2) timezone → country → language
 * 3) English fallback
 */
export function detectVisitorLocale(input?: {
  languages?: readonly string[];
  timeZone?: string;
  countryCode?: string | null;
}): LocaleId {
  const country = input?.countryCode ?? guessCountryFromTimezone(input?.timeZone);
  const fromCountry = localeFromCountryCode(country);

  const languages =
    input?.languages ??
    (typeof navigator !== "undefined"
      ? [...(navigator.languages ?? []), navigator.language].filter(Boolean)
      : []);

  for (const tag of languages) {
    const hit = localeFromLanguageTag(tag);
    if (hit) return hit;
  }

  if (fromCountry) return fromCountry;
  return "en";
}

export function applyDocumentLocale(locale: LocaleId): void {
  if (typeof document === "undefined") return;
  const meta = LOCALE_META[locale];
  document.documentElement.lang = meta.htmlLang;
  document.documentElement.dir = meta.rtl ? "rtl" : "ltr";
}
