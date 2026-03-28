import { fetchEntity } from '@/lib/api/entity';
import Page from '@/templates/nodes/Page';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  let homepage: Record<string, unknown> | null = null;

  try {
    // entity endpoint resolves the front page at path "/"
    const entity = await fetchEntity('/', locale);

    if (entity) {
      homepage = entity.data as Record<string, unknown>;
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
