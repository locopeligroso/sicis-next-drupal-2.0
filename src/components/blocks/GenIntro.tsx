import Image from 'next/image';
import { Typography } from '@/components/composed/Typography';
import { ResponsiveImage } from '@/components/composed/ResponsiveImage';
import { ArrowLink } from '@/components/composed/ArrowLink';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';

export interface GenIntroProps {
  title: string;
  subtitle: string;
  bodyHtml: string;
  imageSrc?: string | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
  imageAlt?: string;
  linkHref?: string | null;
  linkLabel?: string | null;
  className?: string;
}

export function GenIntro({
  title,
  subtitle,
  bodyHtml,
  imageSrc,
  imageWidth,
  imageHeight,
  imageAlt,
  linkHref,
  linkLabel,
  className,
}: GenIntroProps) {
  const hasDimensions = imageWidth != null && imageHeight != null;

  return (
    <section className={cn('flex flex-col gap-(--spacing-content)', className)}>
      {imageSrc &&
        (hasDimensions ? (
          <div className="w-full overflow-hidden">
            <Image
              src={imageSrc}
              alt={imageAlt ?? ''}
              width={imageWidth}
              height={imageHeight}
              className="w-full h-auto object-cover"
            />
          </div>
        ) : (
          <ResponsiveImage
            src={imageSrc}
            alt={imageAlt ?? ''}
            ratio={16 / 3}
            className="rounded-none"
          />
        ))}

      <div className="max-w-main mx-auto px-(--spacing-page) w-full flex flex-col gap-(--spacing-element)">
        <Typography
          textRole="overline"
          as="span"
          className="text-muted-foreground"
        >
          {subtitle}
        </Typography>

        <Typography textRole="h1" as="h1" className="max-w-[40ch]">
          {title}
        </Typography>

        <div
          className="max-w-prose text-muted-foreground prose prose-lg"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
        />

        {linkHref && linkLabel && (
          <ArrowLink href={linkHref} label={linkLabel} />
        )}
      </div>
    </section>
  );
}
