import { notFound } from 'next/navigation';
import { Geist, Geist_Mono, Outfit } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import '@/styles/globals.css';

/**
 * Dev-only layout for /dev/preview/* routes.
 * Provides fonts + design tokens + theme without Header/Footer/i18n.
 * Used by /ds workflow Get-a-Draft to preview components in isolation.
 *
 * Convention: create draft pages at src/app/dev/preview/[name]/page.tsx
 * with a NODE_ENV guard. This layout handles the rest.
 */

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

export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') notFound();
  return (
    <html
      lang="en"
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
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
