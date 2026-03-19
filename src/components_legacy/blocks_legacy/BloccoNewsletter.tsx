import { getProcessedText } from '@/lib/field-helpers';
import { sanitizeHtml } from '@/lib/sanitize';

export default function BloccoNewsletter({ paragraph }: { paragraph: Record<string, unknown> }) {
  const title = getProcessedText(paragraph.field_titolo_formattato);
  return (
    <section className="py-12 border-b border-gray-100 bg-gray-50">
      <div className="max-w-xl mx-auto px-8 text-center">
        {title && (
          <h2
            className="text-2xl font-bold mb-6 leading-tight [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(title) }}
          />
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <input type="email" placeholder="Email" className="flex-1 px-4 py-3 border border-gray-300 text-base outline-none" />
          <button className="px-6 py-3 bg-black text-white text-sm tracking-wider uppercase">Iscriviti</button>
        </div>
      </div>
    </section>
  );
}
