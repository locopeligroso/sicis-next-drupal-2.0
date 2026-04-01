import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export { locales, defaultLocale } from './config';
export type { Locale } from './config';
import { locales, type Locale } from './config';

/**
 * Eagerly import ALL message files so Turbopack can resolve them statically.
 * 'us' reuses EN messages — no separate file needed.
 */
const messageImports: Record<
  string,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  it: () => import('../../messages/it.json'),
  en: () => import('../../messages/en.json'),
  fr: () => import('../../messages/fr.json'),
  de: () => import('../../messages/de.json'),
  es: () => import('../../messages/es.json'),
  ru: () => import('../../messages/ru.json'),
  us: () => import('../../messages/en.json'),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  const loader = messageImports[locale];
  const messages = loader
    ? (await loader()).default
    : (await import('../../messages/en.json')).default;

  return { locale, messages };
});
