'use client';

/**
 * FilterSidebar — client component for catalog filtering.
 *
 * Layout:
 * - Desktop (≥ 48rem): sticky sidebar on the left, always visible
 * - Mobile (< 48rem): hidden sidebar + FAB button (bottom center) + slide-in drawer from left
 *
 * Wireframe phase: inline styles only, rem/em/% units, NO pixels.
 */

import { useState } from 'react';
import { useFilterSync } from '@/hooks/use-filter-sync';
import type { FilterGroupConfig, FilterOption, ActiveFilter } from '@/domain/filters/registry';

// ─── Style constants (wireframe — will be replaced in design phase) ────────
const SIDEBAR_WIDTH = '16.25rem'; // ~260px
const COLOR_ACTIVE_BG = '#111111';
const COLOR_ACTIVE_TEXT = '#ffffff';
const COLOR_ACTIVE_BORDER = '#111111';
const COLOR_INACTIVE_BG = '#ffffff';
const COLOR_INACTIVE_TEXT = '#444444';
const COLOR_INACTIVE_BORDER = '#dddddd';
const COLOR_BORDER_LIGHT = '#e8e8e8';
const COLOR_MUTED = '#999999';
const FONT_LABEL = '0.625rem'; // 10px — group label uppercase
const FONT_PILL = '0.6875rem'; // 11px — pill text
const FONT_CHECK = '0.75rem'; // 12px — checkbox label

// ─── Props ──────────────────────────────────────────────────────────────────
export interface FilterSidebarProps {
  availableFilters: FilterGroupConfig[];
  filterOptions: Record<string, FilterOption[]>;
  activeFilters: ActiveFilter[];
  locale: string;
  basePath: string;
}

// ─── SidebarContent (internal — not exported) ───────────────────────────────
interface SidebarContentProps {
  availableFilters: FilterGroupConfig[];
  filterOptions: Record<string, FilterOption[]>;
  activeFilters: ActiveFilter[];
  locale: string;
  collapsedGroups: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
  toggleFilter: (key: string, value: string, type: 'path' | 'query', pathPrefix?: string) => void;
  clearFilter: (key: string) => void;
  clearAll: () => void;
  isActive: (key: string, value: string) => boolean;
}

function SidebarContent({
  availableFilters,
  filterOptions,
  activeFilters,
  locale,
  collapsedGroups,
  onToggleGroup,
  toggleFilter,
  clearFilter,
  clearAll,
  isActive,
}: SidebarContentProps) {
  // Sort filters P0 → P1 → P2
  const sortedFilters = [...availableFilters].sort((a, b) => {
    const order: Record<string, number> = { P0: 0, P1: 1, P2: 2 };
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
  });

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div style={{ padding: '1rem 0.75rem' }}>
      {/* Active chips strip */}
      {hasActiveFilters && (
        <div
          style={{
            marginBottom: '1.25rem',
            paddingBottom: '1rem',
            borderBottom: `0.0625rem solid ${COLOR_BORDER_LIGHT}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.375rem',
              marginBottom: '0.5rem',
            }}
          >
            {activeFilters.map((filter) => (
              <button
                key={`${filter.key}-${filter.value}`}
                onClick={() => clearFilter(filter.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3125rem',
                  padding: '0.25em 0.625em',
                  border: `0.0625rem solid ${COLOR_ACTIVE_BORDER}`,
                  background: COLOR_ACTIVE_BG,
                  color: COLOR_ACTIVE_TEXT,
                  fontSize: FONT_CHECK,
                  cursor: 'pointer',
                  borderRadius: '0.25rem',
                }}
              >
                {filter.label}
                <span aria-hidden="true" style={{ fontWeight: 400, opacity: 0.7 }}>
                  ×
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={clearAll}
            style={{
              padding: '0.25em 0',
              border: 'none',
              background: 'transparent',
              color: COLOR_MUTED,
              fontSize: FONT_CHECK,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Rimuovi tutti
          </button>
        </div>
      )}

      {/* Filter groups */}
      {sortedFilters.map((filterConfig) => {
        const options = filterOptions[filterConfig.key] ?? [];
        if (options.length === 0) return null;

        // P2 collapsed by default; P0/P1 expanded by default
        const isExpanded = collapsedGroups[filterConfig.key] !== false;
        const activeForGroup = activeFilters.find((f) => f.key === filterConfig.key);

        return (
          <div
            key={filterConfig.key}
            style={{
              marginBottom: '0.25rem',
              borderBottom: `0.0625rem solid ${COLOR_BORDER_LIGHT}`,
            }}
          >
            {/* Group header — collapsible */}
            <button
              onClick={() => onToggleGroup(filterConfig.key)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                padding: '0.625em 0',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: FONT_LABEL,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#333333',
                textAlign: 'left',
              }}
              aria-expanded={isExpanded}
            >
              <span>
                {filterConfig.key.charAt(0).toUpperCase() + filterConfig.key.slice(1)}
                {activeForGroup && (
                  <span
                    aria-hidden="true"
                    style={{ marginLeft: '0.375rem', color: COLOR_ACTIVE_BG, fontWeight: 900 }}
                  >
                    •
                  </span>
                )}
              </span>
              <span
                aria-hidden="true"
                style={{ fontSize: '0.5rem', color: COLOR_MUTED }}
              >
                {isExpanded ? '▲' : '▼'}
              </span>
            </button>

            {/* Options */}
            {isExpanded && (
              <div style={{ paddingBottom: '0.75rem' }}>
                {filterConfig.displayAs === 'buttons' ? (
                  // Pill buttons — radio behavior (single select per group)
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.1875rem',
                    }}
                  >
                    {options.map((option) => {
                      const active = isActive(filterConfig.key, option.slug);
                      return (
                        <button
                          key={option.id ?? option.slug}
                          onClick={() =>
                            toggleFilter(
                              filterConfig.key,
                              option.slug,
                              filterConfig.type,
                              filterConfig.pathPrefix?.[locale],
                            )
                          }
                          style={{
                            padding: '0.375em 0.625em',
                            border: `0.0625rem solid ${active ? COLOR_ACTIVE_BORDER : COLOR_INACTIVE_BORDER}`,
                            background: active ? COLOR_ACTIVE_BG : COLOR_INACTIVE_BG,
                            color: active ? COLOR_ACTIVE_TEXT : COLOR_INACTIVE_TEXT,
                            fontSize: FONT_PILL,
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontWeight: active ? 600 : 400,
                            borderRadius: '0.25rem',
                            transition: 'background 0.15s, color 0.15s',
                          }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  // Checkboxes — multi-select
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                    }}
                  >
                    {options.map((option) => {
                      const active = isActive(filterConfig.key, option.slug);
                      return (
                        <label
                          key={option.id ?? option.slug}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            fontSize: FONT_CHECK,
                            color: COLOR_INACTIVE_TEXT,
                            padding: '0.1875em 0',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() =>
                              toggleFilter(
                                filterConfig.key,
                                option.slug,
                                filterConfig.type,
                              )
                            }
                            style={{ cursor: 'pointer', accentColor: COLOR_ACTIVE_BG }}
                          />
                          {option.label}
                          {option.count !== undefined && (
                            <span style={{ color: COLOR_MUTED, fontSize: FONT_LABEL }}>
                              ({option.count})
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── FilterSidebar (exported) ─────────────────────────────────────────────
export default function FilterSidebar({
  availableFilters,
  filterOptions,
  activeFilters,
  locale,
  basePath,
}: FilterSidebarProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // P2 groups collapsed by default; P0/P1 expanded by default
  // Use lazy initializer to avoid recomputing on every render
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    availableFilters.forEach((f) => {
      if (f.priority === 'P2') initial[f.key] = false;
    });
    return initial;
  });

  const { toggleFilter, clearFilter, clearAll, isActive } = useFilterSync({
    basePath,
    locale,
    activeFilters,
  });

  const handleToggleGroup = (key: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [key]: prev[key] !== false ? false : true,
    }));
  };

  const activeFilterCount = activeFilters.length;

  const sidebarContentProps: SidebarContentProps = {
    availableFilters,
    filterOptions,
    activeFilters,
    locale,
    collapsedGroups,
    onToggleGroup: handleToggleGroup,
    toggleFilter,
    clearFilter,
    clearAll,
    isActive,
  };

  return (
    <>
      {/* Responsive CSS — avoids FOUC vs useMediaQuery (client-only) */}
      <style>{`
        .filter-sidebar-desktop { display: block; }
        .filter-fab { display: none; }
        .filter-drawer-overlay { display: none; }
        .filter-drawer { transform: translateX(-100%); }
        @media (max-width: 48rem) {
          .filter-sidebar-desktop { display: none !important; }
          .filter-fab { display: flex !important; }
          .filter-drawer-overlay { display: block !important; }
        }
        @media (min-width: 48.001rem) {
          .filter-fab { display: none !important; }
          .filter-drawer-overlay { display: none !important; }
          .filter-drawer { transform: translateX(-100%) !important; }
        }
      `}</style>

      {/* Desktop sidebar — sticky, always visible on ≥ 48rem */}
      <aside
        className="filter-sidebar-desktop"
        style={{
          width: SIDEBAR_WIDTH,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          borderRight: `0.0625rem solid ${COLOR_BORDER_LIGHT}`,
          background: '#ffffff',
          flexShrink: 0,
        }}
      >
        <SidebarContent {...sidebarContentProps} />
      </aside>

      {/* FAB — mobile only, fixed bottom center */}
      <button
        className="filter-fab"
        onClick={() => setIsDrawerOpen(true)}
        aria-label={`Filtri${activeFilterCount > 0 ? ` (${activeFilterCount} attivi)` : ''}`}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: COLOR_ACTIVE_BG,
          color: COLOR_ACTIVE_TEXT,
          border: 'none',
          borderRadius: '2rem',
          padding: '0.75rem 1.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          zIndex: 350,
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 0.125rem 0.5rem rgba(0,0,0,0.2)',
        }}
      >
        ⊞ Filtri{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
      </button>

      {/* Overlay — mobile drawer backdrop */}
      {isDrawerOpen && (
        <div
          className="filter-drawer-overlay"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 300,
          }}
        />
      )}

      {/* Drawer — slides in from left on mobile */}
      <div
        className="filter-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Filtri"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: `min(${SIDEBAR_WIDTH}, 85vw)`,
          background: '#ffffff',
          transform: isDrawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          zIndex: 400,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 0.75rem',
            borderBottom: `0.0625rem solid ${COLOR_BORDER_LIGHT}`,
          }}
        >
          <span
            style={{
              fontSize: FONT_LABEL,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#333333',
            }}
          >
            Filtri
          </span>
          <button
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Chiudi filtri"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '1.25rem',
              color: '#333333',
              padding: '0.25rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Drawer content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <SidebarContent {...sidebarContentProps} />
        </div>

        {/* Drawer footer — apply button */}
        <div
          style={{
            padding: '1rem 0.75rem',
            borderTop: `0.0625rem solid ${COLOR_BORDER_LIGHT}`,
          }}
        >
          <button
            onClick={() => setIsDrawerOpen(false)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: COLOR_ACTIVE_BG,
              color: COLOR_ACTIVE_TEXT,
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '0.25rem',
            }}
          >
            Applica{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>
      </div>
    </>
  );
}
