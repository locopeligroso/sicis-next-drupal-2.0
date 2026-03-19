import { getProcessedText } from '@/lib/field-helpers';
import { getDrupalImageUrl } from '@/lib/image-helpers';

export default function BloccoTestoImmagineBig({ paragraph }: { paragraph: Record<string, unknown> }) {
  // Development diagnostics — helps identify missing images in Drupal
  if (process.env.NODE_ENV === 'development') {
    const fi = paragraph.field_immagine;
    if (fi === null) {
      console.warn(
        `[BloccoTestoImmagineBig] field_immagine is null for paragraph ${paragraph.id as string}. ` +
        `No image assigned to this paragraph in Drupal.`,
      );
    } else if (fi && typeof fi === 'object' && !(fi as Record<string, unknown>).uri) {
      console.warn(
        `[BloccoTestoImmagineBig] field_immagine is unresolved stub for paragraph ${paragraph.id as string}:`,
        JSON.stringify(fi),
      );
    }
  }

  const title = getProcessedText(paragraph.field_titolo_formattato);
  const body = getProcessedText(paragraph.field_testo);
  const imageUrl = getDrupalImageUrl(paragraph.field_immagine);

  return (
    <section className="py-16 border-b border-gray-100 bg-gray-50">
      <div className="max-w-6xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Image */}
        <div className="aspect-[3/2] bg-gray-100 overflow-hidden">
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
        {/* Text */}
        <div>
          {title && (
            <h2
              className="text-3xl font-bold mb-4 leading-tight [&_p]:m-0"
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
      </div>
    </section>
  );
}
