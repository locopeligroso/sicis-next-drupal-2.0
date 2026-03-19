export const locales = ['it', 'en', 'fr', 'de', 'es', 'ru'] as const;
export const defaultLocale = 'it' as const;
export type Locale = (typeof locales)[number];
