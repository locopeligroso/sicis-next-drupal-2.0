import { Typography } from '@/components/composed/Typography';
import { ArrowLink } from '@/components/composed/ArrowLink';
import { sanitizeHtml } from '@/lib/sanitize';

interface GenTestoImmagineBodyProps {
  title?: string | null;
  bodyHtml: string;
  linkHref?: string | null;
  linkLabel?: string | null;
}

export function GenTestoImmagineBody({
  title,
  bodyHtml,
  linkHref,
  linkLabel,
}: GenTestoImmagineBodyProps) {
  return (
    <div className="flex flex-col justify-center gap-(--spacing-element) md:h-full">
      {title && (
        <Typography textRole="h2" as="h2">
          {title}
        </Typography>
      )}

      <div
        className="max-w-prose text-muted-foreground prose prose-lg"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
      />

      {linkHref && linkLabel && (
        <ArrowLink href={linkHref} label={linkLabel} className="max-w-xs text-pretty" />
      )}
    </div>
  );
}
