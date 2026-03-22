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

if (process.env.NODE_ENV !== 'development') notFound();

const fontBody = Outfit({ subsets: ['latin'], variable: '--font-body' });
const fontHeading = Geist({ subsets: ['latin'], variable: '--font-heading' });
const fontCode = Geist_Mono({ subsets: ['latin'], variable: '--font-code' });

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn('antialiased', fontBody.variable, fontHeading.variable, fontCode.variable)}
    >
      <body>
        <ThemeProvider>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
