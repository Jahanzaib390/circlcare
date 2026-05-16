import { I18nManager } from 'react-native';
import en from './en.json';
import ur from './ur.json';

export type AppLocale = 'en' | 'ur';

const dictionaries: Record<AppLocale, Record<string, string>> = { en, ur };

let currentLocale: AppLocale = 'en';

export function setLocale(locale: AppLocale) {
  currentLocale = locale;
  I18nManager.allowRTL(locale === 'ur');
  I18nManager.forceRTL(locale === 'ur');
}

export function getLocale(): AppLocale {
  return currentLocale;
}

export function t(key: keyof typeof en): string {
  return dictionaries[currentLocale][key] ?? dictionaries.en[key] ?? key;
}
