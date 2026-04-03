import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import ParagraphResolver from '@/components_legacy/blocks_legacy/ParagraphResolver';
import DrupalImage from '@/components_legacy/DrupalImage';
import { getTitle, getBody } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';
import { fetchBlogTags } from '@/lib/api/listings';

export default async function Articolo({
  node,
}: {
  node: Record<string, unknown>;
}) {
  const locale = await getLocale();
  const title = getTitle(node);
  const body = getBody(node);
  const paragraphs =
    (node.field_blocchi as Record<string, unknown>[] | undefined) ?? [];
  const tags = await fetchBlogTags(locale);

  return (
    <article className="flex flex-col gap-(--spacing-section) pb-(--spacing-section)">
      <DrupalImage
        field={node.field_immagine}
        alt={title ?? ''}
        aspectRatio="16/9"
        style={{ marginBottom: '2rem' }}
      />

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

      {/* Tags */}
      {tags.length > 0 && (
        <footer className="max-w-main mx-auto w-full px-(--spacing-page) border-t border-border pt-(--spacing-content)">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.nid}
                href={
                  tag.path
                    ? `/${locale}${tag.path}`
                    : `/${locale}/blog?tag=${tag.nid}`
                }
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
