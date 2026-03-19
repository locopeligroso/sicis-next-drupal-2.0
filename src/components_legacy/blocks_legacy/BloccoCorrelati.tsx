import { getProcessedText, getTextValue } from '@/lib/field-helpers';
import { getDrupalImageUrl } from '@/lib/image-helpers';
import { fetchParagraph } from '@/lib/fetch-paragraph';

export default async function BloccoCorrelati({ paragraph }: { paragraph: Record<string, unknown> }) {
  // Re-fetch paragraph with nested elements and their images
  const enriched = await fetchParagraph(
    paragraph as { type: string; id: string; [key: string]: unknown },
  );
  const data = enriched ?? paragraph;

  const title = getProcessedText(data.field_titolo_formattato);
  const items = (data.field_elementi as Record<string, unknown>[] | undefined) ?? [];
  const count = items.length || 3;

  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-8">
        {title && (
          <h2
            className="text-2xl font-bold mb-8 leading-tight [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => {
            const item = items[i] as Record<string, unknown> | undefined;
            const imgUrl = item ? getDrupalImageUrl(item.field_immagine) : null;
            const itemTitle = item
              ? (getTextValue(item.field_titolo_main) || getTextValue(item.title))
              : null;
            return (
              <div key={(item?.id as string) ?? i} className="border border-gray-200">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl} alt={itemTitle ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      Img
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-sm leading-snug">
                    {itemTitle || `Elemento ${i + 1}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
