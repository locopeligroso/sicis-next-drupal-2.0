import { getProcessedText } from '@/lib/field-helpers';

export default function BloccoDocumenti({ paragraph }: { paragraph: Record<string, unknown> }) {
  const title = getProcessedText(paragraph.field_titolo_formattato);
  const items = (paragraph.field_documenti as Record<string, unknown>[] | undefined) ?? [];
  const count = items.length || 2;
  return (
    <section className="py-12 border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-8">
        {title && (
          <h2
            className="text-2xl font-bold mb-6 leading-tight [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: title }}
          />
        )}
        <ul className="space-y-2 list-none p-0 m-0">
          {Array.from({ length: count }).map((_, i) => {
            const doc = items[i] as Record<string, unknown> | undefined;
            const docTitle = doc ? ((doc.field_titolo_main as string) || (doc.title as string)) : `Documento ${i + 1}`;
            return (
              <li key={i} className="flex items-center gap-3 p-3 border border-gray-200">
                <span className="text-xl">📄</span>
                <span className="text-sm">{docTitle}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
