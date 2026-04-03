import Image from 'next/image';
import { Typography } from '@/components/composed/Typography';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

export interface GenTestoImmagineBlogProps {
  bodyHtml: string;
  title?: string | null;
  imageSrc?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageAlt?: string;
  className?: string;
}

export function GenTestoImmagineBlog({
  bodyHtml,
  title,
  imageSrc,
  imageWidth,
  imageHeight,
  imageAlt = '',
  className,
}: GenTestoImmagineBlogProps) {
  const hasDimensions = imageWidth != null && imageHeight != null;

  return (
    <section
      className={cn(
        'max-w-prose mx-auto w-full px-(--spacing-page) flex flex-col gap-(--spacing-content)',
        className,
      )}
    >
      {title && (
        <Typography textRole="h2" as="h2">
          {title}
        </Typography>
      )}

      {imageSrc && (
        <div className="overflow-hidden rounded-lg">
          {hasDimensions ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={imageWidth}
              height={imageHeight}
              className="w-full h-auto object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={imageAlt}
              className="w-full h-auto object-cover"
            />
          )}
        </div>
      )}

      <div
        className="text-muted-foreground prose prose-lg"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
      />
    </section>
  );
}
