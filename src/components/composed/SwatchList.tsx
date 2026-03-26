import { cn } from '@/lib/utils';
import { Typography } from '@/components/composed/Typography';

export interface SwatchItem {
  name: string;
  imageSrc?: string | null;
  cssColor?: string;
}

interface SwatchListProps {
  label?: string;
  items: SwatchItem[];
  className?: string;
}

export function SwatchList({ label, items, className }: SwatchListProps) {
  if (items.length === 0) return null;

  return (
    <div className={className}>
      {label && (
        <Typography textRole="overline" className="text-muted-foreground mb-3">
          {label}
        </Typography>
      )}
      <div className="flex flex-wrap gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {item.imageSrc ? (
              // next/image skipped: swatch circle, size-6 = 24px — decorative swatch below 80px threshold
              <img
                src={item.imageSrc}
                alt={item.name}
                className="size-6 shrink-0 rounded-full object-cover border border-border"
              />
            ) : item.cssColor ? (
              <span
                className="size-5 shrink-0 rounded-full border border-border"
                style={{ background: item.cssColor }}
              />
            ) : null}
            {item.name && (
              <Typography
                textRole="body-sm"
                as="span"
                className="text-muted-foreground"
              >
                {item.name}
              </Typography>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
