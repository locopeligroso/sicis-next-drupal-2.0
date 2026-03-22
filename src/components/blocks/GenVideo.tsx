import { VimeoPlayer } from '@/components/composed/VimeoPlayer';
import { cn } from '@/lib/utils';

export interface GenVideoProps {
  videoCode: string;
  posterSrc?: string | null;
  posterAlt?: string;
  className?: string;
}

export function GenVideo({
  videoCode,
  posterSrc,
  posterAlt = '',
  className,
}: GenVideoProps) {
  return (
    <section className={cn('max-w-7xl mx-auto px-(--spacing-page)', className)}>
      <VimeoPlayer
        videoCode={videoCode}
        posterSrc={posterSrc}
        posterAlt={posterAlt}
      />
    </section>
  );
}
