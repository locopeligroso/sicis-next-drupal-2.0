import { resolvePath } from '@/lib/api/resolve-path';
import { fetchContent } from '@/lib/api/content';
import { fetchBlocks } from '@/lib/api/blocks';
import Page from '@/templates/nodes/Page';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  let homepage: Record<string, unknown> | null = null;

  try {
    // Primary: content/{nid} + blocks/{nid}
    // resolve-path doesn't support "/" (Drupal front page has no URL alias).
    // Try resolve-path first, fall back to hardcoded NID 1 (Drupal front page).
    const resolved = await resolvePath('/', locale);
    const homepageNid = resolved?.nid ?? 1;
    const homeBundle = resolved?.bundle ?? 'page';
    const homeType = resolved?.type ?? 'node';

    const [content, blocks] = await Promise.all([
      fetchContent(homepageNid, locale),
      fetchBlocks(homepageNid, locale),
    ]);
    if (content) {
      homepage = {
        ...content,
        type: `${homeType}--${homeBundle}`,
        id: String(homepageNid),
        _nid: homepageNid,
        field_blocchi: blocks,
      } as Record<string, unknown>;
    }

    // C1 entity fallback removed — endpoint is dead (returns HTML, ~6s timeout).
    // Homepage uses content/1 + blocks/1 exclusively.
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
