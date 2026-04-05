/**
 * ProdottoTessuto — DATA INSPECTOR (DS migration preparation)
 *
 * Dumps all fields from the normalized TextileProduct directly from the REST
 * endpoint (/api/v1/textile-product/{nid}), without DS blocks or design.
 * Purpose: visualize what data is actually available per product to inform
 * decisions on which DS blocks/cards to build for the tessuto family.
 *
 * Replaces the legacy 607-line styled template until we rebuild with DS blocks.
 */
import { QuoteSheetProvider } from '@/components/composed/QuoteSheetProvider';
import type { TextileProduct } from '@/lib/api/textile-product';

// ── Helpers ──────────────────────────────────────────────────────────────────

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

function Field({
  name,
  value,
  type,
}: {
  name: string;
  value: unknown;
  type?: string;
}) {
  const empty = isEmpty(value);
  return (
    <div className="py-2 border-b border-border/40">
      <div className="flex items-baseline gap-3 text-xs font-mono">
        <span className="text-muted-foreground font-semibold">{name}</span>
        {type && <span className="text-[0.6875rem] text-muted-foreground/60">[{type}]</span>}
        {empty && <span className="text-[0.6875rem] text-red-500/70 ml-auto">NULL / EMPTY</span>}
      </div>
      {!empty && (
        <div className="mt-1 text-sm font-mono text-foreground break-words">
          {typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : <pre className="text-xs whitespace-pre-wrap bg-muted/30 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}

function Html({ name, html }: { name: string; html: string | null }) {
  const empty = isEmpty(html);
  return (
    <div className="py-2 border-b border-border/40">
      <div className="flex items-baseline gap-3 text-xs font-mono">
        <span className="text-muted-foreground font-semibold">{name}</span>
        <span className="text-[0.6875rem] text-muted-foreground/60">[html]</span>
        {empty && <span className="text-[0.6875rem] text-red-500/70 ml-auto">NULL / EMPTY</span>}
      </div>
      {!empty && html && (
        <>
          <pre className="mt-1 text-xs font-mono text-muted-foreground whitespace-pre-wrap bg-muted/30 p-2 rounded max-h-32 overflow-auto">{html}</pre>
          <div className="mt-2 text-sm [&_p]:m-0 [&_p+p]:mt-2" dangerouslySetInnerHTML={{ __html: html }} />
        </>
      )}
    </div>
  );
}

function Thumb({ url, width, height, alt }: { url: string; width?: number | null; height?: number | null; alt?: string }) {
  return (
    <div className="flex flex-col gap-1 text-xs font-mono">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt ?? ''} className="size-24 object-cover rounded border border-border" loading="lazy" />
      <span className="text-[0.625rem] text-muted-foreground">{width ?? '?'}×{height ?? '?'}</span>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count?: number | string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 py-4 border-t-2 border-border">
      <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
        {title}
        {count !== undefined && (
          <span className="text-xs text-muted-foreground font-normal">({count})</span>
        )}
      </h2>
      {children}
    </section>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProdottoTessuto({
  product,
  slug,
  locale,
}: {
  product: TextileProduct;
  slug?: string[];
  locale: string;
}) {
  return (
    <QuoteSheetProvider productName={product.title}>
      <article className="max-w-main mx-auto px-(--spacing-page) py-8 flex flex-col gap-2">
        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="py-4 border-b-4 border-primary">
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary-text bg-primary-100 px-2 py-0.5 rounded">
              Inspector
            </span>
            <span className="text-xs font-mono text-muted-foreground">ProdottoTessuto — DS migration preview</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">{product.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-xs font-mono text-muted-foreground">
            <span>nid: {product.nid}</span>
            <span>locale: {locale}</span>
            {slug && <span>slug: /{slug.join('/')}</span>}
          </div>
        </header>

        {/* ── Meta Identity ────────────────────────────────────────── */}
        <Section title="Identità">
          <Field name="nid" type="number" value={product.nid} />
          <Field name="title" type="string" value={product.title} />
          <Field name="category" type="object" value={product.category} />
        </Section>

        {/* ── Pricing ──────────────────────────────────────────────── */}
        <Section title="Prezzi">
          <Field name="priceEu" type="string|null" value={product.priceEu} />
          <Field name="priceUsa" type="string|null" value={product.priceUsa} />
        </Section>

        {/* ── Physical specs ───────────────────────────────────────── */}
        <Section title="Specifiche fisiche">
          <Field name="dimensionsCm" type="string|null" value={product.dimensionsCm} />
          <Field name="dimensionsInch" type="string|null" value={product.dimensionsInch} />
          <Field name="heightCm" type="string|null" value={product.heightCm} />
          <Field name="heightInch" type="string|null" value={product.heightInch} />
          <Field name="weight" type="string|null" value={product.weight} />
          <Field name="thickness" type="string|null" value={product.thickness} />
          <Field name="knottingDensity" type="string|null" value={product.knottingDensity} />
          <Field name="usage" type="string|null" value={product.usage} />
        </Section>

        {/* ── Typologies ───────────────────────────────────────────── */}
        <Section title="Tipologie" count={product.typologies.length}>
          {product.typologies.length === 0 ? (
            <div className="text-xs font-mono text-red-500/70">NESSUNA TIPOLOGIA</div>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {product.typologies.map((t) => (
                <li key={t.tid} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  <span className="text-muted-foreground">tid {t.tid}:</span> {t.name}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* ── HTML content ─────────────────────────────────────────── */}
        <Section title="Contenuti HTML">
          <Html name="body (field_testo_main)" html={product.body} />
          <Html name="composition (field_composizione)" html={product.composition} />
        </Section>

        {/* ── Gallery Intro ────────────────────────────────────────── */}
        <Section title="Gallery Intro" count={product.galleryIntro.length}>
          {product.galleryIntro.length === 0 ? (
            <div className="text-xs font-mono text-red-500/70">GALLERY INTRO VUOTA</div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {product.galleryIntro.map((img, i) => (
                <Thumb key={i} url={img.url} width={img.width} height={img.height} alt={`intro ${i}`} />
              ))}
            </div>
          )}
        </Section>

        {/* ── Gallery Main ─────────────────────────────────────────── */}
        <Section title="Gallery Main" count={product.gallery.length}>
          {product.gallery.length === 0 ? (
            <div className="text-xs font-mono text-red-500/70">GALLERY MAIN VUOTA</div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {product.gallery.map((img, i) => (
                <Thumb key={i} url={img.url} width={img.width} height={img.height} alt={`gallery ${i}`} />
              ))}
            </div>
          )}
        </Section>

        {/* ── Finiture (2-level) ───────────────────────────────────── */}
        <Section title="Finiture tessuto" count={product.finiture.length}>
          {product.finiture.length === 0 ? (
            <div className="text-xs font-mono text-red-500/70">NESSUNA FINITURA</div>
          ) : (
            <div className="flex flex-col gap-4">
              {product.finiture.map((cat) => (
                <div key={cat.tid} className="border border-border rounded p-3">
                  <div className="text-xs font-mono mb-2">
                    <span className="font-bold">Categoria:</span> {cat.name}
                    <span className="text-muted-foreground"> (tid {cat.tid})</span>
                    <span className="text-muted-foreground"> — {cat.children.length} varianti</span>
                  </div>
                  {cat.children.length === 0 ? (
                    <div className="text-xs font-mono text-red-500/70">NESSUNA VARIANTE</div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {cat.children.map((v) => (
                        <div key={v.tid} className="flex flex-col gap-1 text-xs font-mono border border-border/40 rounded p-2">
                          <div className="flex items-center gap-2">
                            {v.colorCode && (
                              <span
                                className="size-6 rounded border border-border shrink-0"
                                style={{ backgroundColor: v.colorCode }}
                                title={v.colorCode}
                              />
                            )}
                            <span className="font-bold">{v.name}</span>
                          </div>
                          {v.image && (
                            <Thumb url={v.image.url} width={v.image.width} height={v.image.height} alt={v.name} />
                          )}
                          <div className="text-[0.625rem] text-muted-foreground flex flex-col gap-0.5">
                            <span>tid: {v.tid}</span>
                            {v.colorCode && <span>hex: {v.colorCode}</span>}
                            {v.colorName && <span>colore ref: {v.colorName}</span>}
                            {v.label && <span>etichetta: {v.label}</span>}
                            {v.text && <span className="truncate max-w-40">text: {v.text.slice(0, 50)}...</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Maintenance ──────────────────────────────────────────── */}
        <Section title="Indicazioni manutenzione" count={product.maintenance.length}>
          {product.maintenance.length === 0 ? (
            <div className="text-xs font-mono text-red-500/70">NESSUNA INDICAZIONE</div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {product.maintenance.map((m) => (
                <div key={m.tid} className="flex flex-col items-center gap-1 text-xs font-mono max-w-32">
                  {m.image ? (
                    <Thumb url={m.image.url} width={m.image.width} height={m.image.height} alt={m.name} />
                  ) : (
                    <div className="size-24 bg-muted rounded border border-border flex items-center justify-center text-[0.625rem] text-red-500/70">
                      NO IMG
                    </div>
                  )}
                  <span className="text-center text-[0.6875rem]">{m.name}</span>
                  <span className="text-[0.625rem] text-muted-foreground">tid {m.tid}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Documents ────────────────────────────────────────────── */}
        <Section title="Documenti" count={product.documents.length}>
          {product.documents.length === 0 ? (
            <div className="text-xs font-mono text-red-500/70">NESSUN DOCUMENTO</div>
          ) : (
            <div className="flex flex-col gap-3">
              {product.documents.map((d, i) => (
                <div key={i} className="flex items-start gap-3 border border-border/40 rounded p-2">
                  {d.image && <Thumb url={d.image.url} width={d.image.width} height={d.image.height} alt={d.title} />}
                  <div className="flex flex-col gap-1 text-xs font-mono flex-1 min-w-0">
                    <span className="font-bold">{d.title}</span>
                    {d.href ? (
                      <a href={d.href} target="_blank" rel="noopener noreferrer" className="text-primary-text underline truncate">
                        {d.href}
                      </a>
                    ) : (
                      <span className="text-red-500/70">NESSUN HREF</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* ── Raw JSON Dump ────────────────────────────────────────── */}
        <Section title="JSON completo (TextileProduct normalizzato)">
          <details>
            <summary className="text-xs font-mono text-muted-foreground cursor-pointer hover:text-foreground">
              Espandi
            </summary>
            <pre className="mt-2 text-[0.6875rem] font-mono bg-muted/30 p-3 rounded max-h-96 overflow-auto">
              {JSON.stringify(product, null, 2)}
            </pre>
          </details>
        </Section>
      </article>
    </QuoteSheetProvider>
  );
}
