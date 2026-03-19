import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/request';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { fetchMenu, transformMenuToNavItems } from '@/lib/fetch-menu';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'Sicis', template: '%s | Sicis' },
  description: 'Sicis — The Art of Mosaic',
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  
  // Fetch menus server-side for initial render (SSR/ISR) — in parallel
  // Pass locale so Drupal returns path aliases in the correct language
  const [menu, footerMenu] = await Promise.all([
    fetchMenu('main', locale),
    fetchMenu('footer', locale),
  ]);
  const initialMenu = transformMenuToNavItems(menu, locale);
  const footerMenuItems = transformMenuToNavItems(footerMenu, locale);

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale} initialMenu={initialMenu} />
          <main style={{ minHeight: '60vh' }}>{children}</main>
          <Footer locale={locale} initialMenu={footerMenuItems} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
