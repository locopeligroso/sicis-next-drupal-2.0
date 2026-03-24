import { MediaElement } from '@/components/composed/MediaElement';
import { Typography } from '@/components/composed/Typography';
import { ArrowLink } from '@/components/composed/ArrowLink';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

export interface GenCProps {
  title?: string | null;
  bodyHtml?: string | null;
  linkHref?: string | null;
  linkLabel?: string | null;
  imageSrc?: string | null;
  imageAlt?: string;
  videoCode?: string | null;
  captionHtml?: string | null;
  layout?: 'text_sx' | 'text_dx';
  className?: string;
}

export function GenC({
  title,
  bodyHtml,
  linkHref,
  linkLabel,
  imageSrc,
  imageAlt = '',
  videoCode,
  captionHtml,
  layout = 'text_sx',
  className,
}: GenCProps) {
  const isTextLeft = layout === 'text_sx';

  return (
    <section
      className={cn(
        'w-full max-w-main mx-auto px-(--spacing-page) flex flex-col gap-(--spacing-content)',
        'md:flex-row md:items-center',
        className,
      )}
    >
      {/* Text column — 30% */}
      <div
        className={cn(
          'flex flex-col justify-center gap-(--spacing-element) md:flex-1',
          isTextLeft ? 'md:order-1' : 'md:order-2',
        )}
      >
        {title && (
          <Typography textRole="h2" as="h2">
            {title}
          </Typography>
        )}
        {bodyHtml && (
          <div
            className="max-w-prose text-muted-foreground prose prose-lg"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
          />
        )}
        {linkHref && linkLabel && (
          <ArrowLink href={linkHref} label={linkLabel} className="max-w-xs text-pretty" />
        )}
      </div>

      {/* Media column — 70% */}
      <div className={cn('md:w-[70%] md:shrink-0', isTextLeft ? 'md:order-2' : 'md:order-1')}>
        <MediaElement
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          videoCode={videoCode}
          ratio={3 / 2}
          captionHtml={captionHtml}
        />
      </div>
    </section>
  );
}
