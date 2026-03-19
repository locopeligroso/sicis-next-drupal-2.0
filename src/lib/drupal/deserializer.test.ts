import { describe, it, expect } from 'vitest';
import { buildIncludedMap, deserializeResource } from './deserializer';
import type { JsonApiResource } from './types';

// ════════════════════════════════════════════════════════════════════════════
// buildIncludedMap
// ════════════════════════════════════════════════════════════════════════════

describe('buildIncludedMap', () => {
  it('builds a map from type:id keys', () => {
    const included: JsonApiResource[] = [
      {
        type: 'file--file',
        id: 'file-uuid-1',
        attributes: { uri: { url: '/sites/default/files/image1.jpg' } },
      },
      {
        type: 'taxonomy_term--mosaico_colori',
        id: 'term-uuid-2',
        attributes: { name: 'Rosso' },
      },
    ];

    const map = buildIncludedMap(included);

    expect(map.size).toBe(2);
    expect(map.has('file--file:file-uuid-1')).toBe(true);
    expect(map.has('taxonomy_term--mosaico_colori:term-uuid-2')).toBe(true);
    expect(map.get('file--file:file-uuid-1')).toBe(included[0]);
    expect(map.get('taxonomy_term--mosaico_colori:term-uuid-2')).toBe(included[1]);
  });

  it('returns empty map for undefined', () => {
    const map = buildIncludedMap(undefined);

    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// deserializeResource
// ════════════════════════════════════════════════════════════════════════════

describe('deserializeResource', () => {
  it('flattens attributes to top level', () => {
    const resource: JsonApiResource = {
      type: 'node--prodotto_mosaico',
      id: 'node-uuid-1',
      attributes: {
        title: 'Test',
        field_prezzo_eu: '100',
        field_titolo_main: 'Main Title',
        langcode: 'it',
      },
    };

    const result = deserializeResource(resource, new Map());

    expect(result.type).toBe('node--prodotto_mosaico');
    expect(result.id).toBe('node-uuid-1');
    expect(result.title).toBe('Test');
    expect(result.field_prezzo_eu).toBe('100');
    expect(result.field_titolo_main).toBe('Main Title');
    expect(result.langcode).toBe('it');
  });

  it('resolves single relationship from included map', () => {
    const fileResource: JsonApiResource = {
      type: 'file--file',
      id: 'file-abc',
      attributes: {
        uri: { url: '/sites/default/files/product.jpg' },
        filename: 'product.jpg',
      },
    };

    const resource: JsonApiResource = {
      type: 'node--prodotto_mosaico',
      id: 'node-uuid-1',
      attributes: { title: 'Mosaico Product' },
      relationships: {
        field_immagine: {
          data: { type: 'file--file', id: 'file-abc' },
        },
      },
    };

    const includedMap = buildIncludedMap([fileResource]);
    const result = deserializeResource(resource, includedMap);

    expect(result.field_immagine).toBeDefined();
    const img = result.field_immagine as Record<string, unknown>;
    expect(img.type).toBe('file--file');
    expect(img.id).toBe('file-abc');
    const uri = img.uri as { url: string };
    expect(uri.url).toBe('/sites/default/files/product.jpg');
  });

  it('resolves array relationship from included map', () => {
    const termA: JsonApiResource = {
      type: 'taxonomy_term--mosaico_colori',
      id: 'term-a',
      attributes: { name: 'Rosso' },
    };
    const termB: JsonApiResource = {
      type: 'taxonomy_term--mosaico_colori',
      id: 'term-b',
      attributes: { name: 'Blu' },
    };

    const resource: JsonApiResource = {
      type: 'node--prodotto_mosaico',
      id: 'node-uuid-1',
      attributes: { title: 'Mosaico Product' },
      relationships: {
        field_colori: {
          data: [
            { type: 'taxonomy_term--mosaico_colori', id: 'term-a' },
            { type: 'taxonomy_term--mosaico_colori', id: 'term-b' },
          ],
        },
      },
    };

    const includedMap = buildIncludedMap([termA, termB]);
    const result = deserializeResource(resource, includedMap);

    expect(Array.isArray(result.field_colori)).toBe(true);
    const colori = result.field_colori as Record<string, unknown>[];
    expect(colori).toHaveLength(2);
    expect(colori[0].name).toBe('Rosso');
    expect(colori[1].name).toBe('Blu');
  });

  it('preserves meta on resolved single relationship', () => {
    const fileResource: JsonApiResource = {
      type: 'file--file',
      id: 'file-abc',
      attributes: {
        uri: { url: '/sites/default/files/hero.jpg' },
        filename: 'hero.jpg',
      },
    };

    const resource: JsonApiResource = {
      type: 'node--prodotto_mosaico',
      id: 'node-uuid-1',
      attributes: { title: 'Product With Image Meta' },
      relationships: {
        field_immagine: {
          data: {
            type: 'file--file',
            id: 'file-abc',
            meta: { alt: 'Photo', width: 1200, height: 800 },
          },
        },
      },
    };

    const includedMap = buildIncludedMap([fileResource]);
    const result = deserializeResource(resource, includedMap);

    const img = result.field_immagine as Record<string, unknown>;
    expect(img.type).toBe('file--file');
    expect(img.id).toBe('file-abc');
    const meta = img.meta as Record<string, unknown>;
    expect(meta.alt).toBe('Photo');
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(800);
  });

  it('preserves meta on resolved array relationships', () => {
    const fileA: JsonApiResource = {
      type: 'file--file',
      id: 'file-a',
      attributes: {
        uri: { url: '/sites/default/files/gallery1.jpg' },
      },
    };
    const fileB: JsonApiResource = {
      type: 'file--file',
      id: 'file-b',
      attributes: {
        uri: { url: '/sites/default/files/gallery2.jpg' },
      },
    };

    const resource: JsonApiResource = {
      type: 'node--prodotto_mosaico',
      id: 'node-uuid-1',
      attributes: { title: 'Gallery Product' },
      relationships: {
        field_gallery: {
          data: [
            {
              type: 'file--file',
              id: 'file-a',
              meta: { alt: 'Gallery shot 1', width: 800, height: 600 },
            },
            {
              type: 'file--file',
              id: 'file-b',
              meta: { alt: 'Gallery shot 2', width: 1024, height: 768 },
            },
          ],
        },
      },
    };

    const includedMap = buildIncludedMap([fileA, fileB]);
    const result = deserializeResource(resource, includedMap);

    const gallery = result.field_gallery as Record<string, unknown>[];
    expect(gallery).toHaveLength(2);

    const meta0 = gallery[0].meta as Record<string, unknown>;
    expect(meta0.alt).toBe('Gallery shot 1');
    expect(meta0.width).toBe(800);
    expect(meta0.height).toBe(600);

    const meta1 = gallery[1].meta as Record<string, unknown>;
    expect(meta1.alt).toBe('Gallery shot 2');
    expect(meta1.width).toBe(1024);
    expect(meta1.height).toBe(768);
  });

  it('preserves meta on unresolved relationships (not in included)', () => {
    const resource: JsonApiResource = {
      type: 'node--prodotto_mosaico',
      id: 'node-uuid-1',
      attributes: { title: 'Orphan Ref Product' },
      relationships: {
        field_immagine: {
          data: {
            type: 'file--file',
            id: 'file-not-in-included',
            meta: { alt: 'Missing image', width: 640, height: 480 },
          },
        },
      },
    };

    const result = deserializeResource(resource, new Map());

    const img = result.field_immagine as Record<string, unknown>;
    expect(img.type).toBe('file--file');
    expect(img.id).toBe('file-not-in-included');
    const meta = img.meta as Record<string, unknown>;
    expect(meta.alt).toBe('Missing image');
    expect(meta.width).toBe(640);
    expect(meta.height).toBe(480);
  });

  it('sets null for relationships with null data', () => {
    const resource: JsonApiResource = {
      type: 'node--prodotto_mosaico',
      id: 'node-uuid-1',
      attributes: { title: 'No Image Product' },
      relationships: {
        field_immagine: {
          data: null,
        },
        field_collezione: {
          data: null,
        },
      },
    };

    const result = deserializeResource(resource, new Map());

    expect(result.field_immagine).toBeNull();
    expect(result.field_collezione).toBeNull();
  });

  it('prevents infinite recursion at depth 5', () => {
    // Create a resource that references itself via included map, simulating
    // a circular reference chain deeper than 5 levels.
    const selfRef: JsonApiResource = {
      type: 'node--page',
      id: 'self-ref-uuid',
      attributes: { title: 'Self Referencing' },
      relationships: {
        field_parent: {
          data: { type: 'node--page', id: 'self-ref-uuid' },
        },
      },
    };

    const includedMap = buildIncludedMap([selfRef]);

    // Calling at depth 0 should work and eventually stop recursion
    const result = deserializeResource(selfRef, includedMap, 0);

    // The top-level result should have all attributes
    expect(result.title).toBe('Self Referencing');
    expect(result.type).toBe('node--page');

    // Walk the chain: each level should have field_parent resolved
    // until depth > 5, where it returns just { type, id }
    let current = result;
    let resolvedDepth = 0;
    while (current.field_parent && (current.field_parent as Record<string, unknown>).title) {
      current = current.field_parent as Record<string, unknown>;
      resolvedDepth++;
    }

    // At depth 5, deserializeResource returns { type, id } (no title, no field_parent)
    // So from depth 0 we can traverse field_parent 5 times (depths 1-5)
    // At the 6th step (depth 6), it returns bare { type, id }
    expect(resolvedDepth).toBeLessThanOrEqual(5);

    // The leaf node should be a bare reference with only type and id
    const leaf = current.field_parent as Record<string, unknown>;
    expect(leaf).toBeDefined();
    expect(leaf.type).toBe('node--page');
    expect(leaf.id).toBe('self-ref-uuid');
    expect(leaf.title).toBeUndefined();
  });
});
