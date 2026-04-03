import Image from 'next/image';
import { Typography } from '@/components/composed/Typography';
import { ArrowLink } from '@/components/composed/ArrowLink';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

export interface GenTestoImmagineBigProps {
  imageSrc: string;
  imageAlt: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  title?: string | null;
  bodyHtml?: string | null;
  linkHref?: string | null;
  linkLabel?: string | null;
  className?: string;
}

export function GenTestoImmagineBig({
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  title,
  bodyHtml,
  linkHref,
  linkLabel,
  className,
}: GenTestoImmagineBigProps) {
  const hasText = title || bodyHtml;
  const hasDimensions = imageWidth != null && imageHeight != null;

  return (
    <section className={cn('flex flex-col gap-(--spacing-content)', className)}>
      {hasText && (
        <div className="max-w-main mx-auto w-full px-(--spacing-page) grid grid-cols-1 md:grid-cols-2 gap-(--spacing-content)">
          {title ? (
            <Typography textRole="h2" as="h2" className="self-end">
              {title}
            </Typography>
          ) : (
            <div />
          )}
          {(bodyHtml || linkHref) && (
            <div className="flex flex-col gap-(--spacing-element) justify-end">
              {bodyHtml && (
                <div
                  className="text-muted-foreground prose prose-lg"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
                />
              )}
              {linkHref && linkLabel && (
                <ArrowLink
                  href={linkHref}
                  label={linkLabel}
                  external={linkHref.startsWith('http')}
                />
              )}
            </div>
          )}
        </div>
      )}

      <div className="w-full overflow-hidden">
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
    </section>
  );
}
