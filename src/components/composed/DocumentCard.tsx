import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Typography } from '@/components/composed/Typography';
import { Card, CardContent } from '@/components/ui/card';
import {
  DownloadIcon,
  PlayIcon,
  ExternalLinkIcon,
  BookOpenIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DocumentCardItem {
  title: string;
  type?: string;
  image?: { url: string; width: number | null; height: number | null } | null;
  href?: string | null;
  downloadLabel?: string;
}

interface ActionLabels {
  discover: string;
  watchVideo: string;
  downloadPdf: string;
  browseCatalogue: string;
}

function getActionFromHref(
  href: string | null | undefined,
  labels: ActionLabels,
) {
  if (!href) return { label: labels.discover, icon: ExternalLinkIcon };
  if (/youtube|vimeo/i.test(href))
    return { label: labels.watchVideo, icon: PlayIcon };
  if (/\.pdf(\?|$)/i.test(href))
    return { label: labels.downloadPdf, icon: DownloadIcon };
  if (/catalog|library/i.test(href))
    return { label: labels.browseCatalogue, icon: BookOpenIcon };
  return { label: labels.discover, icon: ExternalLinkIcon };
}

interface DocumentCardProps {
  item: DocumentCardItem;
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

export async function DocumentCard({
  item,
  layout = 'vertical',
  className,
}: DocumentCardProps) {
  const tCommon = await getTranslations('common');
  const labels: ActionLabels = {
    discover: tCommon('discover'),
    watchVideo: tCommon('watchVideo'),
    downloadPdf: tCommon('downloadPdf'),
    browseCatalogue: tCommon('browseCatalogue'),
  };

  const Wrapper = item.href ? 'a' : 'div';
  const wrapperProps = item.href
    ? { href: item.href, target: '_blank' as const, rel: 'noopener noreferrer' }
    : {};

  const isHorizontal = layout === 'horizontal';
  const action = item.downloadLabel
    ? {
        label: item.downloadLabel,
        icon: getActionFromHref(item.href, labels).icon,
      }
    : getActionFromHref(item.href, labels);
  const ActionIcon = action.icon;

  return (
    <Card
      className={cn(
        'overflow-hidden group transition-shadow hover:shadow-lg p-0 gap-0',
        className,
      )}
    >
      <Wrapper
        {...wrapperProps}
        className={cn(isHorizontal ? 'flex flex-row' : 'block')}
      >
        {/* Cover image */}
        {item.image?.url ? (
          <div
            className={cn(
              'relative overflow-hidden bg-surface-2',
              isHorizontal
                ? 'w-32 md:w-40 shrink-0 aspect-square'
                : 'aspect-square',
            )}
          >
            <Image
              src={item.image.url}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div
            className={cn(
              'bg-surface-2 flex items-center justify-center',
              isHorizontal
                ? 'w-32 md:w-40 shrink-0 aspect-square'
                : 'aspect-square',
            )}
          >
            <ActionIcon className="size-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Content */}
        <CardContent
          className={cn(
            'flex flex-col gap-1.5',
            isHorizontal ? 'justify-center p-5 md:p-6' : 'p-4',
          )}
        >
          {item.type && (
            <Typography textRole="overline" className="text-muted-foreground">
              {item.type}
            </Typography>
          )}
          <Typography textRole="body-md" className="font-semibold leading-snug">
            {item.title}
          </Typography>
          <span className="text-primary-text text-sm font-medium group-hover:underline inline-flex items-center gap-1.5 mt-1">
            <ActionIcon className="size-3.5" />
            {action.label}
          </span>
        </CardContent>
      </Wrapper>
    </Card>
  );
}
