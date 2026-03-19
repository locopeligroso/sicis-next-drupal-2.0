import { getProcessedText } from '@/lib/field-helpers';

export default function BloccoTutorial({ paragraph }: { paragraph: Record<string, unknown> }) {
  const title = getProcessedText(paragraph.field_titolo_formattato);
  const body = getProcessedText(paragraph.field_testo);
  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-8">
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
    </section>
  );
}
