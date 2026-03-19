import { getProcessedText } from '@/lib/field-helpers';
import { getDrupalImageUrl, fetchParagraph } from '@/lib/drupal';

export default async function BloccoGalleryIntro({ paragraph }: { paragraph: Record<string, unknown> }) {
  // Re-fetch paragraph with nested elements and their images
  const enriched = await fetchParagraph(paragraph as { type: string; id: string; [key: string]: unknown });
  const data = enriched ?? paragraph;

  const title = getProcessedText(data.field_titolo_formattato);
  const body = getProcessedText(data.field_testo);
  const items = (data.field_slide as Record<string, unknown>[] | undefined) ?? [];

  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-8">
        {(title || body) && (
          <div className="mb-8 max-w-2xl">
            {title && (
              <h2
                className="text-2xl font-bold mb-4 leading-tight [&_p]:m-0"
                dangerouslySetInnerHTML={{ __html: title }}
              />
            )}
            {body && (
              <div
                className="text-gray-600 leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            )}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(items.length > 0 ? items : Array.from({ length: 3 })).map((item, i) => {
            const el = item as Record<string, unknown> | undefined;
            const imgUrl = el ? getDrupalImageUrl(el.field_immagine) : null;
            return (
              <div key={i} className="aspect-square bg-gray-100 overflow-hidden">
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
      </div>
    </section>
  );
}
