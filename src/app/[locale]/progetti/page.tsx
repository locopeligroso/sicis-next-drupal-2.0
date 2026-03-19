import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchProjects } from '@/lib/drupal';
import type { ProgettoCard } from '@/lib/drupal';

interface ProgettiPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: ProgettiPageProps) {
  const { locale } = await params;
  const titles: Record<string, string> = {
    it: 'Progetti',
    en: 'Projects',
    fr: 'Projets',
    de: 'Projekte',
    es: 'Proyectos',
    ru: 'Проекты',
  };
  return { title: titles[locale] ?? 'Progetti' };
}

export default async function ProgettiPage({ params }: ProgettiPageProps) {
  const { locale } = await params;
  const { projects, total } = await fetchProjects(locale);

  if (!projects) notFound();

  const heading: Record<string, string> = {
    it: 'Progetti',
    en: 'Projects',
    fr: 'Projets',
    de: 'Projekte',
    es: 'Proyectos',
    ru: 'Проекты',
  };

  return (
    <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1
        style={{
          fontSize: 'clamp(1.75rem, 4vw, 3rem)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
          lineHeight: 1.1,
        }}
      >
        {heading[locale] ?? 'Progetti'}
      </h1>

      {total > 0 && (
        <p style={{ color: '#666', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
          {total} {total === 1 ? 'progetto' : 'progetti'}
        </p>
      )}

      {projects.length === 0 ? (
        <p style={{ color: '#888', fontSize: '1rem' }}>Nessun progetto disponibile.</p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))',
            gap: '2rem',
          }}
        >
          {projects.map((project: ProgettoCard) => (
            <li key={project.id}>
              <ProgettoCardItem project={project} locale={locale} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function ProgettoCardItem({
  project,
  locale,
}: {
  project: ProgettoCard;
  locale: string;
}) {
  const href = project.path ? `/${locale}${project.path}` : null;

  const card = (
    <article
      style={{
        borderRadius: '0.5rem',
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        cursor: href ? 'pointer' : 'default',
      }}
    >
      {/* Image */}
      <div
        style={{
          aspectRatio: '4/3',
          background: '#f0f0f0',
          overflow: 'hidden',
        }}
      >
        {project.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.imageUrl}
            alt={project.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transition: 'transform 0.3s ease',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bbb',
              fontSize: '0.8rem',
            }}
          >
            No image
          </div>
        )}
      </div>

      {/* Title */}
      <div style={{ padding: '1rem 1.25rem 1.25rem' }}>
        <h2
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.4,
            margin: 0,
            color: '#111',
          }}
        >
          {project.title}
        </h2>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{ textDecoration: 'none', display: 'block' }}
      >
        {card}
      </Link>
    );
  }

  return card;
}

export const revalidate = 300;
