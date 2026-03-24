import { AspectRatio } from '@/components/ui/aspect-ratio';
import { VimeoPlayer } from '@/components/composed/VimeoPlayer';
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
      {hasVideo ? (
        <div className="overflow-hidden rounded-lg">
          <VimeoPlayer videoCode={videoCode!} />
        </div>
      ) : (
        <AspectRatio ratio={ratio} className="overflow-hidden rounded-lg bg-muted">
          <img src={imageSrc!} alt={imageAlt} className="size-full object-cover" />
        </AspectRatio>
      )}
      {captionHtml && (
        <figcaption
          className="mt-2 text-sm text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(captionHtml) }}
        />
      )}
    </figure>
  );
}
