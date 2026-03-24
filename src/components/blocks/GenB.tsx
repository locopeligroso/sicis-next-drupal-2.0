import { MediaElement } from '@/components/composed/MediaElement';
import { cn } from '@/lib/utils';

export interface GenBItem {
  imageSrc?: string | null;
  imageAlt?: string;
  videoCode?: string | null;
}

export interface GenBProps {
  items: GenBItem[];
  className?: string;
}

export function GenB({ items, className }: GenBProps) {
  if (items.length === 0) return null;

  const [first, ...rest] = items;

  return (
    <section
      className={cn(
        'w-full max-w-main mx-auto px-(--spacing-page)',
        className,
      )}
    >
      {/* Desktop: 3 equal columns */}
      <div className="hidden md:flex md:gap-(--spacing-content)">
        {items.map((item, i) => (
          <div key={i} className="flex-1">
            <MediaElement
              imageSrc={item.imageSrc}
              imageAlt={item.imageAlt}
              videoCode={item.videoCode}
              ratio={1}
            />
          </div>
        ))}
      </div>

      {/* Mobile: first full-width, rest 2-up */}
      <div className="flex flex-col gap-(--spacing-content) md:hidden">
        <MediaElement
          imageSrc={first.imageSrc}
          imageAlt={first.imageAlt}
          videoCode={first.videoCode}
          ratio={1}
        />
        {rest.length > 0 && (
          <div className="flex gap-(--spacing-content)">
            {rest.map((item, i) => (
              <div key={i} className="flex-1">
                <MediaElement
                  imageSrc={item.imageSrc}
                  imageAlt={item.imageAlt}
                  videoCode={item.videoCode}
                  ratio={1}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
