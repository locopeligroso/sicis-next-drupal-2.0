import { getTitle, getBody } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';
import { Typography } from '@/components/composed/Typography';

export default function Tag({ node }: { node: Record<string, unknown> }) {
  const title = getTitle(node);
  const body = getBody(node);

  return (
    <article className="flex flex-col gap-(--spacing-section)">
      <header className="max-w-main mx-auto w-full px-(--spacing-page)">
        {title && (
          <Typography textRole="h1" as="h1">
            {title}
          </Typography>
        )}
        {body && (
          <div
            className="prose mt-(--spacing-content)"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
          />
        )}
      </header>

      {/* Placeholder for related articles — will be populated when field_tags is added to articles API */}
      <section className="max-w-main mx-auto w-full px-(--spacing-page)">
        <Typography textRole="body-sm" as="p" className="text-muted-foreground">
          Articoli correlati in arrivo.
        </Typography>
      </section>
    </article>
  );
}
