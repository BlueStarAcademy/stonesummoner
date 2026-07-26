import { applyDocumentLocale, detectVisitorLocale } from "./detect";
import { isLocaleId, LOCALE_IDS, LOCALE_META } from "./locales";
import type { LocaleId, MessageDict, MessageKey } from "./types";

import ar from "./messages/ar";
import de from "./messages/de";
import en from "./messages/en";
import es from "./messages/es";
import fr from "./messages/fr";
import id from "./messages/id";
import it from "./messages/it";
import ja from "./messages/ja";
import ko from "./messages/ko";
import nl from "./messages/nl";
import pl from "./messages/pl";
import ptBR from "./messages/pt-BR";
import ru from "./messages/ru";
import th from "./messages/th";
import tr from "./messages/tr";
import vi from "./messages/vi";
import zhHans from "./messages/zh-Hans";
import zhHant from "./messages/zh-Hant";

const STORAGE_KEY = "ss.locale";

const CATALOG: Record<LocaleId, MessageDict> = {
  ko,
  en,
  ja,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
  de,
  fr,
  es,
  "pt-BR": ptBR,
  ru,
  it,
  th,
  vi,
  id,
  ar,
  tr,
  pl,
  nl,
};

let currentLocale: LocaleId = "en";
let ready = false;

export type TVars = Record<string, string | number>;

function readStoredLocale(): LocaleId | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isLocaleId(raw)) return raw;
  } catch {
    /* private mode / blocked storage */
  }
  return null;
}

function writeStoredLocale(locale: LocaleId): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v == null ? `{${key}}` : String(v);
  });
}

/** Resolve active locale (stored preference, else visitor country / browser). */
export function initI18n(): LocaleId {
  const stored = readStoredLocale();
  currentLocale = stored ?? detectVisitorLocale();
  applyDocumentLocale(currentLocale);
  ready = true;
  return currentLocale;
}

export function getLocale(): LocaleId {
  if (!ready) initI18n();
  return currentLocale;
}

export function getLocaleMeta() {
  return LOCALE_META[getLocale()];
}

export function listLocales() {
  return LOCALE_IDS.map((id) => LOCALE_META[id]);
}

export function setLocale(locale: LocaleId, opts?: { persist?: boolean }): void {
  if (!isLocaleId(locale)) return;
  currentLocale = locale;
  if (opts?.persist !== false) writeStoredLocale(locale);
  applyDocumentLocale(locale);
}

export function t(key: MessageKey, vars?: TVars): string {
  const locale = getLocale();
  const dict = CATALOG[locale] ?? CATALOG.en;
  const template = dict[key] ?? CATALOG.en[key] ?? key;
  return interpolate(template, vars);
}

export function formatNumber(n: number): string {
  return n.toLocaleString(getLocaleMeta().bcp47);
}

export {
  detectVisitorLocale,
  localeFromCountryCode,
  localeFromLanguageTag,
  guessCountryFromTimezone,
} from "./detect";
export { isLocaleId, LOCALE_IDS, LOCALE_META } from "./locales";
export type { LocaleId, MessageKey, MessageDict, LocaleMeta } from "./types";
