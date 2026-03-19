import type { Metadata } from 'next';
import { Geist, Geist_Mono, Outfit } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/request';
import Header from '@/components_legacy/Header';
import Footer from '@/components_legacy/Footer';
import { fetchMenu, transformMenuToNavItems } from '@/lib/fetch-menu';
import { cn } from '@/lib/utils';
import '@/styles/globals.css';

const fontBody = Outfit({ subsets: ['latin'], variable: '--font-body' });
const fontHeading = Geist({ subsets: ['latin'], variable: '--font-heading' });
const fontCode = Geist_Mono({ subsets: ['latin'], variable: '--font-code' });

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
    <html
      lang={locale}
      className={cn(
        'antialiased',
        fontBody.variable,
        fontHeading.variable,
        fontCode.variable
      )}
    >
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
