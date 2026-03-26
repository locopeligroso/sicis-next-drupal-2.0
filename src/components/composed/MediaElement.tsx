import Image from 'next/image';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

export interface MediaElementProps {
  imageSrc?: string | null;
  imageAlt?: string;
  videoCode?: string | null;
  ratio?: number;
  captionHtml?: string | null;
  className?: string;
}

export function MediaElement({
  imageSrc,
  imageAlt = '',
  videoCode,
  ratio = 1,
  captionHtml,
  className,
}: MediaElementProps) {
  const hasVideo = !!videoCode;
  const hasImage = !!imageSrc;

  if (!hasVideo && !hasImage) return null;

  return (
    <figure className={cn('flex flex-col', className)}>
      <AspectRatio
        ratio={ratio}
        className="overflow-hidden rounded-lg bg-muted"
      >
        {hasVideo ? (
          <iframe
            src={`https://player.vimeo.com/video/${videoCode}?background=1`}
            className="absolute inset-0 size-full scale-150 object-cover"
            allow="autoplay"
            title=""
            style={{ border: 0 }}
          />
        ) : (
          <Image
            src={imageSrc!}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        )}
      </AspectRatio>
      {captionHtml && (
        <figcaption
          className="mt-2 text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(captionHtml) }}
        />
      )}
    </figure>
  );
}
