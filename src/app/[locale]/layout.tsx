import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Outfit } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/request';
import Footer from '@/components_legacy/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { fetchMenu, transformMenuToNavItems } from '@/lib/drupal';
import { mapMenuToNavbar } from '@/lib/navbar/menu-mapper';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { SampleCartProvider } from '@/domain/sample-cart/SampleCartProvider';
import '@/styles/globals.css';

const fontBody = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '700'],
});
const fontHeading = Geist({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '700'],
});
const fontCode = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-code',
  display: 'swap',
  weight: ['400', '700'],
});

export const revalidate = 600;

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
  setRequestLocale(locale);

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
  const navbarMenu = mapMenuToNavbar(initialMenu);
  const footerMenuItems = transformMenuToNavItems(footerMenu, locale);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        'antialiased',
        fontBody.variable,
        fontHeading.variable,
        fontCode.variable,
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <NextIntlClientProvider messages={messages}>
              <SampleCartProvider locale={locale}>
                <Navbar locale={locale} menu={navbarMenu} />
                {process.env.NODE_ENV === 'development' && (
                  <div className="fixed bottom-2 left-2 z-[9999] rounded bg-black/80 px-2 py-1 font-mono text-xs text-white">
                    <span className="sm:hidden">base (&lt;640)</span>
                    <span className="hidden sm:inline md:hidden">
                      sm (640-767)
                    </span>
                    <span className="hidden md:inline lg:hidden">
                      md (768-1023)
                    </span>
                    <span className="hidden lg:inline xl:hidden">
                      lg (1024-1279)
                    </span>
                    <span className="hidden xl:inline 2xl:hidden">
                      xl (1280-1535)
                    </span>
                    <span className="hidden 2xl:inline">2xl (1536+)</span>
                  </div>
                )}
                <Suspense
                  fallback={
                    <main className="flex min-h-[60vh] items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
                    </main>
                  }
                >
                  <main style={{ minHeight: '60vh' }}>{children}</main>
                </Suspense>
                <Footer locale={locale} initialMenu={footerMenuItems} />
                <Toaster />
              </SampleCartProvider>
            </NextIntlClientProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}
