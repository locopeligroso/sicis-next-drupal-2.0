import Image from 'next/image';
import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';
import { ContactCta } from '@/components/composed/ContactCta';
import { getTitle, getBody } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';
import { resolveImageUrl } from '@/lib/api/client';

export default function Ambiente({ node }: { node: Record<string, unknown> }) {
  const title =
    getTitle(node);
  const body = getBody(node);
  const paragraphs =
    (node.field_blocchi as Record<string, unknown>[] | undefined) ?? [];
  const imageUrl = resolveImageUrl(node.field_immagine);

  return (
    <article className="flex flex-col gap-(--spacing-section) pb-(--spacing-section)">
      {imageUrl && (
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={imageUrl}
            alt={title ?? ''}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      {body && (
        <div
          style={{ lineHeight: 1.7, marginBottom: '2rem' }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
        />
      )}

      {paragraphs.map((p, i) => (
        <ParagraphResolver
          key={(p.id as string) ?? i}
          paragraph={p}
          pageTitle={title ?? undefined}
        />
      ))}

      <ContactCta />
    </article>
  );
}
