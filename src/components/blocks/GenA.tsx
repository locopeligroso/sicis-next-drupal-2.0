import { MediaElement } from '@/components/composed/MediaElement';
import { cn } from '@/lib/utils';

export interface GenAProps {
  imageSrc?: string | null;
  imageAlt?: string;
  videoCode?: string | null;
  ratio?: number;
  captionHtml?: string | null;
  imageSmallSrc?: string | null;
  imageSmallAlt?: string;
  videoSmallCode?: string | null;
  ratioSmall?: number;
  captionSmallHtml?: string | null;
  layout?: 'img_big_sx' | 'img_big_dx';
  className?: string;
}

export function GenA({
  imageSrc,
  imageAlt = '',
  videoCode,
  ratio = 1,
  captionHtml,
  imageSmallSrc,
  imageSmallAlt = '',
  videoSmallCode,
  ratioSmall = 1,
  captionSmallHtml,
  layout = 'img_big_sx',
  className,
}: GenAProps) {
  const isBigLeft = layout === 'img_big_sx';

  return (
    <section
      className={cn(
        'max-w-main mx-auto px-(--spacing-page) flex flex-col gap-(--spacing-content)',
        'md:flex-row md:items-center',
        className,
      )}
    >
      {/* Big element */}
      <div className={cn('md:w-3/5 md:shrink-0', isBigLeft ? 'md:order-1' : 'md:order-2')}>
        <MediaElement
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          videoCode={videoCode}
          ratio={ratio}
          captionHtml={captionHtml}
          className="[&_[data-slot=aspect-ratio]]:[--ratio:1] md:[&_[data-slot=aspect-ratio]]:[--ratio:unset]"
        />
      </div>

      {/* Small element */}
      <div className={cn('md:flex-1', isBigLeft ? 'md:order-2' : 'md:order-1')}>
        <MediaElement
          imageSrc={imageSmallSrc}
          imageAlt={imageSmallAlt}
          videoCode={videoSmallCode}
          ratio={ratioSmall}
          captionHtml={captionSmallHtml}
          className="[&_[data-slot=aspect-ratio]]:[--ratio:1] md:[&_[data-slot=aspect-ratio]]:[--ratio:unset]"
        />
      </div>
    </section>
  );
}
