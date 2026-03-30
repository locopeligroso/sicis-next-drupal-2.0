import { cn } from '@/lib/utils';
import { VimeoPlayer } from '@/components/composed/VimeoPlayer';

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
    <section
      className={cn('max-w-main mx-auto px-(--spacing-page)', className)}
    >
      <VimeoPlayer
        videoCode={videoCode}
        posterSrc={posterSrc}
        posterAlt={posterAlt}
      />
    </section>
  );
}
