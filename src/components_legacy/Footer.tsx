import Link from 'next/link';
import type { MenuItem } from '@/lib/drupal';
import { locales } from '@/i18n/config';

const PRODUCT_LINKS: Record<string, { label: string; href: string }[]> = {
  en: [
    { label: 'Mosaic', href: '/en/mosaic' },
    { label: 'Vetrite', href: '/en/vetrite-glass-slabs' },
    { label: 'Furniture', href: '/en/furniture-and-accessories' },
    { label: 'Textile', href: '/en/textiles/fabrics' },
    { label: 'Pixall', href: '/en/pixall' },
    { label: 'Lighting', href: '/en/category/lighting' },
  ],
  it: [
    { label: 'Mosaico', href: '/it/mosaico' },
    { label: 'Vetrite', href: '/it/lastre-vetro-vetrite' },
    { label: 'Arredo', href: '/it/arredo' },
    { label: 'Tessuto', href: '/it/prodotti-tessili' },
    { label: 'Pixall', href: '/it/pixall' },
    { label: 'Illuminazione', href: '/it/categoria/illuminazione' },
  ],
  fr: [
    { label: 'Mosaïque', href: '/fr/mosaïque' },
    { label: 'Vetrite', href: '/fr/plaque-en-verre-vetrite' },
    { label: 'Mobilier', href: '/fr/ameublement' },
    { label: 'Textile', href: '/fr/produits-textiles/tissus' },
    { label: 'Pixall', href: '/fr/pixall' },
    { label: 'Éclairage', href: '/fr/categorie/éclairage' },
  ],
  de: [
    { label: 'Mosaik', href: '/de/mosaik' },
    { label: 'Vetrite', href: '/de/glasscheibe-vetrite' },
    { label: 'Möbel', href: '/de/einrichtung' },
    { label: 'Textil', href: '/de/textilien/stoffe' },
    { label: 'Pixall', href: '/de/pixall' },
    { label: 'Leuchten', href: '/de/kategorie/leuchten' },
  ],
  es: [
    { label: 'Mosaico', href: '/es/mosaico' },
    { label: 'Vetrite', href: '/es/láminas-de-vidrio-vetrite' },
    { label: 'Muebles', href: '/es/mueble' },
    { label: 'Textil', href: '/es/textiles/telas' },
    { label: 'Pixall', href: '/es/pixall' },
    { label: 'Iluminación', href: '/es/categoria/iluminación' },
  ],
  ru: [
    { label: 'Мозаика', href: '/ru/мозаика' },
    { label: 'Vetrite', href: '/ru/стеклянные-листы-vetrite' },
    { label: 'Мебель', href: '/ru/обстановка' },
    { label: 'Текстиль', href: '/ru/текстильные-изделия/ткани' },
    { label: 'Pixall', href: '/ru/pixall' },
    { label: 'Освещение', href: '/ru/категория/освещение' },
  ],
  us: [
    { label: 'Mosaic', href: '/us/mosaic' },
    { label: 'Vetrite', href: '/us/vetrite-glass-slabs' },
    { label: 'Furniture', href: '/us/furniture-and-accessories' },
    { label: 'Textile', href: '/us/textiles/fabrics' },
    { label: 'Pixall', href: '/us/pixall' },
    { label: 'Lighting', href: '/us/category/lighting' },
  ],
};

const COMPANY_LINKS: Record<string, { label: string; href: string }[]> = {
  en: [
    { label: 'Projects', href: '/en/projects' },
    { label: 'News', href: '/en/news' },
    { label: 'Showroom', href: '/en/showroom' },
    { label: 'Contact', href: '/en/contatti' },
  ],
  it: [
    { label: 'Progetti', href: '/it/progetti' },
    { label: 'News', href: '/it/news' },
    { label: 'Showroom', href: '/it/showroom' },
    { label: 'Contatti', href: '/it/contatti' },
  ],
  fr: [
    { label: 'Projets', href: '/fr/projects' },
    { label: 'News', href: '/fr/news' },
    { label: 'Showroom', href: '/fr/showroom' },
    { label: 'Contact', href: '/fr/contatti' },
  ],
  de: [
    { label: 'Projekte', href: '/de/projects' },
    { label: 'News', href: '/de/news' },
    { label: 'Showroom', href: '/de/showroom' },
    { label: 'Kontakt', href: '/de/contatti' },
  ],
  es: [
    { label: 'Proyectos', href: '/es/projects' },
    { label: 'News', href: '/es/news' },
    { label: 'Showroom', href: '/es/showroom' },
    { label: 'Contacto', href: '/es/contatti' },
  ],
  ru: [
    { label: 'Проекты', href: '/ru/projects' },
    { label: 'Новости', href: '/ru/news' },
    { label: 'Шоурум', href: '/ru/showroom' },
    { label: 'Контакты', href: '/ru/contatti' },
  ],
  us: [
    { label: 'Projects', href: '/us/projects' },
    { label: 'News', href: '/us/news' },
    { label: 'Showroom', href: '/us/showroom' },
    { label: 'Contact', href: '/us/contatti' },
  ],
};

/** Extracts children of the first top-level item whose title matches the given keyword (case-insensitive). */
function extractMenuSection(
  menu: MenuItem[],
  keyword: string,
): MenuItem[] | null {
  const match = menu.find((item) =>
    item.title.toLowerCase().includes(keyword.toLowerCase()),
  );
  return match && match.children.length > 0 ? match.children : null;
}

interface FooterProps {
  locale: string;
  initialMenu?: MenuItem[];
}

export default function Footer({ locale, initialMenu }: FooterProps) {
  const year = new Date().getFullYear();

  // Derive dynamic sections from Drupal menu when available
  const menuProducts =
    initialMenu && initialMenu.length > 0
      ? extractMenuSection(initialMenu, 'explore')
      : null;

  const menuCompany =
    initialMenu && initialMenu.length > 0
      ? extractMenuSection(initialMenu, 'projects')
      : null;

  // Map Drupal MenuItem[] to the same shape used by the fallback arrays
  const toLinks = (items: MenuItem[]) =>
    items.map((item) => ({ label: item.title, href: item.url }));

  // Prefer dynamic menu data; fall back to hardcoded locale-specific links
  const products = menuProducts
    ? toLinks(menuProducts)
    : (PRODUCT_LINKS[locale] ?? PRODUCT_LINKS['en']);

  const company = menuCompany
    ? toLinks(menuCompany)
    : (COMPANY_LINKS[locale] ?? COMPANY_LINKS['en']);

  const labels = {
    products:
      locale === 'it'
        ? 'Prodotti'
        : locale === 'en'
          ? 'Products'
          : locale === 'fr'
            ? 'Produits'
            : locale === 'de'
              ? 'Produkte'
              : locale === 'es'
                ? 'Productos'
                : locale === 'us'
                  ? 'Products'
                  : 'Продукция',
    company:
      locale === 'it'
        ? 'Azienda'
        : locale === 'en'
          ? 'Company'
          : locale === 'fr'
            ? 'Entreprise'
            : locale === 'de'
              ? 'Unternehmen'
              : locale === 'es'
                ? 'Empresa'
                : locale === 'us'
                  ? 'Company'
                  : 'Компания',
  };

  return (
    <footer
      style={{
        borderTop: '0.0625rem solid #e0e0e0',
        background: '#111',
        color: '#fff',
        marginTop: '4rem',
      }}
    >
      <div
        style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '3rem 2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
          gap: '2rem',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: '0 0 1rem',
            }}
          >
            SICIS
          </p>
          <p
            style={{
              fontSize: '0.875rem',
              color: '#aaa',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            The Art of Mosaic
          </p>
        </div>

        <div>
          <p
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#888',
              margin: '0 0 1rem',
            }}
          >
            {labels.products}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {products.map((item) => (
              <li key={item.href} style={{ marginBottom: '0.5rem' }}>
                <Link
                  href={item.href}
                  style={{
                    fontSize: '0.875rem',
                    color: '#ccc',
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#888',
              margin: '0 0 1rem',
            }}
          >
            {labels.company}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {company.map((item) => (
              <li key={item.href} style={{ marginBottom: '0.5rem' }}>
                <Link
                  href={item.href}
                  style={{
                    fontSize: '0.875rem',
                    color: '#ccc',
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        style={{
          borderTop: '0.0625rem solid #333',
          padding: '1.5rem 2rem',
          maxWidth: '80rem',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
          © {year} Sicis. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {locales.map((lang) => (
            <Link
              key={lang}
              href={`/${lang}`}
              style={{
                fontSize: '0.75rem',
                color: lang === locale ? '#fff' : '#666',
                textDecoration: 'none',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {lang}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
