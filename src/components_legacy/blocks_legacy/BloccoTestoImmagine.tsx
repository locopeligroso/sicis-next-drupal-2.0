import { getProcessedText } from '@/lib/field-helpers';
import { getDrupalImageUrl } from '@/lib/drupal';

export default function BloccoTestoImmagine({ paragraph }: { paragraph: Record<string, unknown> }) {
  const title = getProcessedText(paragraph.field_titolo_formattato);
  const body = getProcessedText(paragraph.field_testo);
  const imageUrl = getDrupalImageUrl(paragraph.field_immagine);
  const layout = (paragraph.field_layout_blocco_testo_img as string) || 'text_sx';
  const isTextRight = layout === 'text_dx';

  return (
    <section className="py-12 border-b border-gray-100">
      <div className={`max-w-5xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center ${isTextRight ? 'md:[direction:rtl]' : ''}`}>
        {/* Text */}
        <div className={isTextRight ? 'md:[direction:ltr]' : ''}>
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
        {/* Image */}
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={title ? title.replace(/<[^>]*>/g, '') : ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
              Immagine
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
