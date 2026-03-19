import { getProcessedText } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';

export default function BloccoQuote({ paragraph }: { paragraph: Record<string, unknown> }) {
  const body = getProcessedText(paragraph.field_testo);

  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-8">
        {body && (
          <blockquote
            className="text-xl md:text-2xl font-light italic leading-relaxed text-gray-700 border-l-4 border-gray-300 pl-6 [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
          />
        )}
      </div>
    </section>
  );
}
