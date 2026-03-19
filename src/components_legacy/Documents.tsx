import { getDrupalImageUrl } from '@/lib/drupal';
interface DocumentItem {
  id?: string;
  field_titolo_main?: unknown;
  title?: unknown;
  field_tipologia_documento?: unknown;
  field_collegamento_esterno?: unknown;
  field_immagine?: unknown;
  field_allegato?: {
    entity?: { uri?: { value?: string } };
  } | null;
}

interface DocumentsProps {
  documents: DocumentItem[];
  title?: string;
}

const sectionStyle: React.CSSProperties = {
  borderTop: '1px solid #e0e0e0',
  paddingTop: '2rem',
  marginTop: '2rem',
};

const headingStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#888',
  marginBottom: '1rem',
};

/**
 * Shared document list component.
 * Replaces 5 near-identical implementations in:
 * ProdottoMosaico, ProdottoTessuto, ProdottoArredo, ProdottoVetrite, ProdottoPixall
 */
export function Documents({ documents, title = 'Documenti' }: DocumentsProps) {
  if (!documents.length) return null;

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>{title}</h2>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {documents.map((doc, i) => {
          const extLinkRaw = doc.field_collegamento_esterno;
          const docLink =
            typeof extLinkRaw === 'string'
              ? extLinkRaw
              : (extLinkRaw as { uri?: string } | null)?.uri ?? null;
          const allegato = doc.field_allegato?.entity?.uri?.value ?? null;
          const href = docLink || allegato;
          if (!href) return null;

          const imgUrl = getDrupalImageUrl(doc.field_immagine);
          const label =
            typeof doc.field_titolo_main === 'string'
              ? doc.field_titolo_main
              : (doc.field_titolo_main as { value?: string } | null)?.value ??
                (doc.title as string | undefined) ??
                'Documento';

          return (
            <li
              key={doc.id ?? i}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
            >
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: '3rem',
                    height: '3rem',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              )}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Scarica ${label}`}
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
