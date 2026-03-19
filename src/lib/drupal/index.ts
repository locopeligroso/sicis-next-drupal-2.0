/**
 * Unified Drupal client — single source of truth for all Drupal API access.
 *
 * Consolidates:
 *   - config.ts             (constants)
 *   - types.ts              (interfaces)
 *   - deserializer.ts       (JSON:API deserialization)
 *   - core.ts               (path resolution, JSON:API fetch, deserialization)
 *   - image.ts              (image URL extraction)
 *   - menu.ts               (menu fetching + nav-item transformation)
 *   - paragraphs.ts         (paragraph secondary fetches)
 *   - products.ts           (product listing)
 *   - filters.ts            (taxonomy filter options)
 *   - projects.ts           (project listing)
 *   - translated-path.ts    (cross-locale path resolution)
 *
 * Architecture decision: Apollo (2026-03-19)
 */

export * from './config';
export * from './types';
export * from './deserializer';
export * from './core';
export * from './image';
export * from './menu';
export * from './paragraphs';
export * from './products';
export * from './filters';
export * from './projects';
export * from './translated-path';
