import { getProcessedText } from '@/lib/field-helpers';

export default function BloccoIntro({ paragraph }: { paragraph: Record<string, unknown> }) {
  const title = getProcessedText(paragraph.field_titolo_formattato);
  const body = getProcessedText(paragraph.field_testo);

  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-8 text-center">
        {title && (
          <h2
            className="text-2xl md:text-3xl font-bold mb-6 leading-tight [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        )}
        {body && (
          <div
            className="text-gray-600 leading-relaxed text-lg [&_p]:mb-3 [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
      </div>
    </section>
  );
}
