import { translatePath, fetchJsonApiResource } from '@/lib/get-resource-by-path';
import { getIncludeFields } from '@/lib/node-resolver';
import Page from '@/components/nodes/Page';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  let homepage: Record<string, unknown> | null = null;

  try {
    // Drupal's front page resolves via decoupled_router at /
    const translated = await translatePath('/', locale);

    if (translated) {
      const bundle = translated.entity.bundle; // 'page'
      const include = getIncludeFields(bundle); // 'field_blocchi,field_blocchi.field_immagine'
      homepage = await fetchJsonApiResource(translated.jsonapi.individual, {
        include,
        revalidate: 600,
      }) as Record<string, unknown> | null;
    }
  } catch (error) {
    console.error('[HomePage] Failed to fetch homepage node', error);
  }

  if (!homepage) {
    return (
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: '2rem',
        }}
      >
        <p style={{ color: '#666', fontSize: '1rem' }}>
          Homepage not configured in Drupal.
        </p>
      </main>
    );
  }

  return <Page node={homepage} />;
}

export const revalidate = 600;
