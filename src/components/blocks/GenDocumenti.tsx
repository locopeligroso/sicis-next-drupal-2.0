import { Typography } from '@/components/composed/Typography';
import { DocumentCard } from '@/components/composed/DocumentCard';
import type { DocumentCardItem } from '@/components/composed/DocumentCard';
import { cn } from '@/lib/utils';

export type GenDocumentiItem = DocumentCardItem;

export interface GenDocumentiProps {
  documents: GenDocumentiItem[];
  title?: string | null;
  className?: string;
}

export function GenDocumenti({
  documents,
  title,
  className,
}: GenDocumentiProps) {
  if (documents.length === 0) return null;

  const useHorizontal = documents.length <= 2;

  return (
    <section className={cn('max-w-main mx-auto px-(--spacing-page) w-full flex flex-col gap-(--spacing-content)', className)}>
      {title && (
        <Typography textRole="h3" as="h3">
          {title}
        </Typography>
      )}

      <div className={cn(
        'grid gap-(--spacing-element)',
        useHorizontal
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      )}>
        {documents.map((doc, i) => (
          <DocumentCard
            key={i}
            item={doc}
            layout={useHorizontal ? 'horizontal' : 'vertical'}
          />
        ))}
      </div>
    </section>
  );
}
