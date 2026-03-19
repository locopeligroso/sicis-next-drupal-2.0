import { getProcessedText } from '@/lib/field-helpers';
import { getDrupalImageUrl } from '@/lib/drupal';

export default function BloccoTestoImmagineBlog({ paragraph }: { paragraph: Record<string, unknown> }) {
  const title = getProcessedText(paragraph.field_titolo_formattato);
  const body = getProcessedText(paragraph.field_testo);
  const imageUrl = getDrupalImageUrl(paragraph.field_immagine);

  return (
    <section className="py-8 border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-8">
        {title && (
          <h2
            className="text-xl md:text-2xl font-bold mb-4 leading-tight [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        )}
        <div className="aspect-video bg-gray-100 overflow-hidden mb-6">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">Immagine</div>
          )}
        </div>
        {body && (
          <div
            className="text-gray-600 leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
      </div>
    </section>
  );
}
