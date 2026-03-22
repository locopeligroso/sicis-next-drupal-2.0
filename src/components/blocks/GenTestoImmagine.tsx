import { ResponsiveImage } from '@/components/composed/ResponsiveImage';
import { GenTestoImmagineBody } from '@/components/composed/GenTestoImmagineBody';
import { cn } from '@/lib/utils';

export interface GenTestoImmagineProps {
  bodyHtml: string;
  imageSrc: string;
  imageAlt: string;
  title?: string | null;
  layout?: 'text_dx' | 'text_sx' | 'text_up';
  linkHref?: string | null;
  linkLabel?: string | null;
  className?: string;
}

export function GenTestoImmagine({
  bodyHtml,
  imageSrc,
  imageAlt,
  title,
  layout = 'text_dx',
  linkHref,
  linkLabel,
  className,
}: GenTestoImmagineProps) {
  const isStack = layout === 'text_up';

  const textBlock = (
    <GenTestoImmagineBody
      title={title}
      bodyHtml={bodyHtml}
      linkHref={linkHref}
      linkLabel={linkLabel}
    />
  );

  if (isStack) {
    // text_up → landscape 3:2, stack verticale
    const mutedFromRight = true; // default: muted da destra, testo a sinistra

    return (
      <section className={cn('relative overflow-hidden flex flex-col gap-(--spacing-content)', className)}>
          <div className={cn(
          'max-w-main mx-auto px-(--spacing-page) w-full',
          !mutedFromRight && 'flex justify-end',
        )}>
          <div className="md:max-w-lg">
            {textBlock}
          </div>
        </div>
        <div className="relative max-w-main mx-auto px-(--spacing-page) w-full">
          <div className={cn(
            'absolute bg-muted -top-8 bottom-8 w-screen',
            mutedFromRight
              ? 'left-1/2 rounded-l-2xl'
              : 'right-1/2 rounded-r-2xl',
          )} />
          <div className="relative overflow-hidden rounded-lg">
            <ResponsiveImage src={imageSrc} alt={imageAlt} ratio={3 / 2} />
          </div>
        </div>
      </section>
    );
  }

  // text_dx / text_sx → portrait 2:3, affiancato su desktop
  const isTextRight = layout === 'text_dx';

  return (
    <section className={cn('relative overflow-hidden flex flex-col gap-(--spacing-content)', className)}>

      {/* Text — mobile only, before image */}
      <div className="md:hidden px-(--spacing-page)">
        {textBlock}
      </div>

      <div className="relative">
        {/* Mobile: muted on opposite side of image */}
        <div className={cn(
          'md:hidden absolute inset-y-0 w-1/3 bg-muted',
          isTextRight
            ? 'right-0 rounded-l-2xl'
            : 'left-0 rounded-r-2xl',
        )} />

        <div className="relative max-w-main mx-auto">
          <div className={cn(
            'flex flex-col gap-(--spacing-content)',
            'md:flex-row md:items-center md:gap-(--spacing-content) md:px-(--spacing-page)',
          )}>
            {/* Image column with muted band */}
            <div className={cn(
              'relative w-3/5 md:w-2/5 md:shrink-0',
              isTextRight
                ? 'self-start md:self-auto md:order-1'
                : 'self-end md:self-auto md:order-2',
            )}>
              <div className={cn(
                'hidden md:block absolute inset-y-0 w-screen bg-muted',
                isTextRight
                  ? 'right-0 rounded-r-2xl'
                  : 'left-0 rounded-l-2xl',
              )} />
              <div className={cn(
                'relative overflow-hidden',
                isTextRight ? 'rounded-r-lg' : 'rounded-l-lg',
              )}>
                <ResponsiveImage src={imageSrc} alt={imageAlt} ratio={2 / 3} />
              </div>
            </div>

            {/* Text — desktop only */}
            <div className={cn(
              'hidden md:block md:max-w-sm md:flex-1',
              isTextRight ? 'md:order-2' : 'md:order-1',
            )}>
              {textBlock}
            </div>

            {/* Desktop: decorative muted on far side */}
            <div className={cn(
              'hidden md:block relative md:w-16 md:shrink-0 md:self-stretch',
              isTextRight ? 'md:order-3' : 'md:order-0',
            )}>
              <div className={cn(
                'absolute inset-y-0 w-screen bg-muted',
                isTextRight
                  ? 'left-0 rounded-l-2xl'
                  : 'right-0 rounded-r-2xl',
              )} />
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
