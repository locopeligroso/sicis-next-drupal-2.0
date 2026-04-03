import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { toDrupalLocale } from '@/i18n/config';
import { Typography } from '@/components/composed/Typography';
import { Separator } from '@/components/ui/separator';

interface ElementoTecnico {
  nid: number | string;
  type: string;
  field_titolo_main: string;
  aliases?: Record<string, string>;
}

export interface GenEProps {
  paragraph: Record<string, unknown>;
}

/**
 * GenE — renders a list of technical links (catalogs, certifications, tutorials, display solutions).
 * Maps to Drupal paragraph type `blocco_e`.
 *
 * Fields:
 * - field_titolo_formattato: section title
 * - field_elementi_tecnici: array of referenced pages with aliases
 */
export async function GenE({ paragraph }: GenEProps) {
  const locale = await getLocale();
  const drupalLocale = toDrupalLocale(locale);

  const title = paragraph.field_titolo_formattato as string | undefined;
  const items =
    (paragraph.field_elementi_tecnici as ElementoTecnico[] | undefined) ?? [];

  if (items.length === 0) return null;

  return (
    <section className="max-w-main mx-auto px-(--spacing-page)">
      {title && (
        <Typography textRole="overline" as="h2" className="mb-4">
          {title}
        </Typography>
      )}
      <Separator className="mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => {
          const alias = item.aliases?.[drupalLocale] ?? item.aliases?.[locale];
          const href = alias ? `/${locale}${alias}` : '#';

          return (
            <Link
              key={item.nid}
              href={href}
              className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <Typography
                textRole="body-sm"
                className="text-foreground group-hover:text-primary-text"
              >
                {item.field_titolo_main}
              </Typography>
              <span className="ml-auto text-muted-foreground transition-transform group-hover:translate-x-0.5">
                &rarr;
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
