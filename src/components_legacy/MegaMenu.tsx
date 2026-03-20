'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { MenuItem } from '@/lib/drupal';

const MAX_LINKS_PER_COLUMN = 8;

interface MegaMenuProps {
  items: MenuItem[];
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  locale: string; // reserved for future use (locale-aware links in panel)
}

function MegaMenuColumn({
  item,
  onClose,
}: {
  item: MenuItem;
  onClose: () => void;
}) {
  const t = useTranslations('nav');
  const visibleLinks = item.children.slice(0, MAX_LINKS_PER_COLUMN);
  const hasMore = item.children.length > MAX_LINKS_PER_COLUMN;

  // Fix B & C — hover state for links and column title
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [titleHovered, setTitleHovered] = useState(false);

  const columnTitleStyles = {
    display: 'block',
    fontSize: '0.65rem',
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    // Fix C — title hover: #333 on hover, #aaa default
    color: titleHovered ? '#333' : '#aaa',
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: '0.0625rem solid #eee',
    textDecoration: 'none',
    transition: 'color 0.12s',
  };

  return (
    <div style={{ minWidth: '9rem' }}>
      {/* Column title — link only if url exists */}
      {item.url ? (
        <Link
          href={item.url}
          onClick={onClose}
          onMouseEnter={() => setTitleHovered(true)}
          onMouseLeave={() => setTitleHovered(false)}
          style={columnTitleStyles}
        >
          {item.title}
        </Link>
      ) : (
        <span style={columnTitleStyles}>{item.title}</span>
      )}

      {/* Collection/category links */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {visibleLinks.map((link) => (
          <Link
            key={link.id}
            href={link.url}
            onClick={onClose}
            // Fix B — hover state per link
            onMouseEnter={() => setHoveredId(link.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              fontSize: '0.8rem',
              color: hoveredId === link.id ? '#000' : '#444',
              textDecoration: 'none',
              padding: '0.3rem 0',
              paddingLeft: hoveredId === link.id ? '0.3rem' : '0',
              display: 'block',
              transition: 'color 0.12s, padding-left 0.12s',
              borderBottom: '0.0625rem solid transparent',
            }}
          >
            {link.title}
          </Link>
        ))}

        {/* Fix D — "Vedi tutte" more visible styling */}
        {hasMore &&
          (item.url ? (
            <Link
              href={item.url}
              onClick={onClose}
              style={{
                fontSize: '0.72rem',
                color: '#888',
                textDecoration: 'none',
                marginTop: '0.35rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              {t('viewAll')} →
            </Link>
          ) : (
            <span
              style={{
                fontSize: '0.72rem',
                color: '#888',
                marginTop: '0.35rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              {t('viewAll')} →
            </span>
          ))}
      </div>
    </div>
  );
}

/**
 * Flat list layout: when all items are leaf nodes (no children),
 * render as a multi-column grid of links instead of individual column headers.
 */
function MegaMenuFlatList({
  items,
  onClose,
}: {
  items: MenuItem[];
  onClose: () => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <ul
      style={{
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))',
        gap: '0.25rem 2rem',
      }}
    >
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.url || '#'}
            onClick={onClose}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              fontSize: '0.8rem',
              color: hoveredId === item.id ? '#000' : '#444',
              textDecoration: 'none',
              padding: '0.4rem 0',
              paddingLeft: hoveredId === item.id ? '0.3rem' : '0',
              display: 'block',
              transition: 'color 0.12s, padding-left 0.12s',
            }}
          >
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function MegaMenu({
  items,
  onClose,
  onMouseEnter,
  onMouseLeave,
  // locale: available for future use
}: MegaMenuProps) {
  const t = useTranslations('nav');

  if (items.length === 0) return null;

  // Detect flat list: all items are leaf nodes (no children)
  const isFlat = items.every((item) => item.children.length === 0);

  return (
    <nav
      aria-label={t('megaMenu')}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '0.125rem solid #111',
        borderBottom: '0.0625rem solid #e0e0e0',
        boxShadow: '0 0.75rem 2rem rgba(0,0,0,0.1)',
        zIndex: 99,
      }}
    >
      <div
        style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.75rem 2rem' }}
      >
        {isFlat ? (
          <MegaMenuFlatList items={items} onClose={onClose} />
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              gap: 0,
            }}
          >
            {items.map((col, idx) => (
              <li
                key={col.id}
                style={{
                  flex: '0 0 auto',
                  paddingRight: '2.5rem',
                  marginRight: '2.5rem',
                  borderRight:
                    idx < items.length - 1 ? '0.0625rem solid #f0f0f0' : 'none',
                }}
              >
                <MegaMenuColumn item={col} onClose={onClose} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}
