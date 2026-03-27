export const locales = ['it', 'en', 'fr', 'de', 'es', 'ru', 'us'] as const;
export const defaultLocale = 'it' as const;
export type Locale = (typeof locales)[number];

/** Locales that don't exist in Drupal and map to another Drupal locale for API calls */
const LOCALE_TO_DRUPAL: Partial<Record<Locale, string>> = { us: 'en' };

/** Returns the Drupal-side locale code. Maps 'us' → 'en', passes others through. */
export function toDrupalLocale(locale: string): string {
  return LOCALE_TO_DRUPAL[locale as Locale] ?? locale;
}
