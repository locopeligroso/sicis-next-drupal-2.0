import { Typography } from '@/components/composed/Typography';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

export interface GenTestoImmagineBlogProps {
  bodyHtml: string;
  title?: string | null;
  imageSrc?: string | null;
  imageAlt?: string;
  className?: string;
}

export function GenTestoImmagineBlog({
  bodyHtml,
  title,
  imageSrc,
  imageAlt = '',
  className,
}: GenTestoImmagineBlogProps) {
  return (
    <section className={cn('max-w-prose mx-auto w-full px-(--spacing-page) flex flex-col gap-(--spacing-content)', className)}>
      {title && (
        <Typography textRole="h2" as="h2">
          {title}
        </Typography>
      )}

      {imageSrc && (
        <div className="overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      <div
        className="text-muted-foreground prose prose-lg"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
      />
    </section>
  );
}
