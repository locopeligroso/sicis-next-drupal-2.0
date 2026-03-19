import { getDrupalImageUrl, fetchParagraph } from '@/lib/drupal';

export default async function BloccoGallery({ paragraph }: { paragraph: Record<string, unknown> }) {
  // Re-fetch paragraph with nested slides and their images
  // NOTE: Drupal field is field_slide, NOT field_elementi
  // Guard: fetchParagraph requires { type, id } — fall back to paragraph as-is if missing
  const enriched =
    typeof paragraph.type === 'string' && typeof paragraph.id === 'string'
      ? await fetchParagraph(paragraph as { type: string; id: string; [key: string]: unknown })
      : null;
  const data = enriched ?? paragraph;

  const items = (data.field_slide as Record<string, unknown>[] | undefined) ?? [];

  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-8">
        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item, i) => {
              const el = item as Record<string, unknown>;
              const imgUrl = getDrupalImageUrl(el.field_immagine);
              return (
                <div key={(el.id as string) ?? i} className="aspect-square bg-gray-100 overflow-hidden">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      {i + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-100 flex items-center justify-center text-gray-300 text-xs">
                {i + 1}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
