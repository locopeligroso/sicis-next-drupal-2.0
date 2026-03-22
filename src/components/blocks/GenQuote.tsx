import { Typography } from '@/components/composed/Typography';
import { ArrowLink } from '@/components/composed/ArrowLink';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

export interface GenQuoteProps {
  text: string;
  linkHref?: string | null;
  linkLabel?: string | null;
  className?: string;
}

export function GenQuote({
  text,
  linkHref,
  linkLabel,
  className,
}: GenQuoteProps) {
  return (
    <section className={cn('max-w-7xl mx-auto px-(--spacing-page)', className)}>
      <figure className="flex flex-col gap-(--spacing-element) border-l-4 border-primary pl-(--spacing-content)">
        <Typography textRole="blockquote" as="blockquote">
          <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />
        </Typography>

        {linkHref && linkLabel && (
          <figcaption>
            <ArrowLink href={linkHref} label={linkLabel} />
          </figcaption>
        )}
      </figure>
    </section>
  );
}
