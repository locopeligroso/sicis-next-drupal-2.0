import { getDrupalImageUrl } from '@/lib/drupal';

interface DrupalImageProps {
  field: unknown;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
  aspectRatio?: string;
}

/**
 * Renders a Drupal image field.
 * Falls back to nothing if the image is not available.
 */
export default function DrupalImage({
  field,
  alt = '',
  style,
  className,
  aspectRatio = '16/9',
}: DrupalImageProps) {
  const url = getDrupalImageUrl(field);
  if (!url) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      style={{
        width: '100%',
        aspectRatio,
        objectFit: 'cover',
        display: 'block',
        ...style,
      }}
      className={className}
    />
  );
}
