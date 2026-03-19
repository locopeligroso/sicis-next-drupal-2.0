// ════════════════════════════════════════════════════════════════════════════
// §3  Deserialization (FIXED — preserves relationship meta)
// ════════════════════════════════════════════════════════════════════════════

import type { JsonApiResource } from './types';

export function buildIncludedMap(
  included: JsonApiResource[] | undefined,
): Map<string, JsonApiResource> {
  const map = new Map<string, JsonApiResource>();
  if (!included) return map;
  for (const item of included) {
    map.set(`${item.type}:${item.id}`, item);
  }
  return map;
}

/**
 * Deserializes a JSON:API resource, flattening attributes and resolving
 * relationships via the included map.
 *
 * **Fix**: when resolving relationships, the `meta` field from `rel.data`
 * (which contains `alt`, `title`, `width`, `height` for images) is now
 * preserved on the deserialized object.
 */
export function deserializeResource(
  resource: JsonApiResource,
  includedMap: Map<string, JsonApiResource>,
  depth = 0,
): Record<string, unknown> {
  // Prevent infinite recursion on circular references
  if (depth > 5) return { type: resource.type, id: resource.id };

  const result: Record<string, unknown> = {
    type: resource.type,
    id: resource.id,
  };

  // Flatten attributes to top level
  if (resource.attributes) {
    for (const [key, value] of Object.entries(resource.attributes)) {
      result[key] = value;
    }
  }

  // Resolve relationships using included map
  if (resource.relationships) {
    for (const [key, rel] of Object.entries(resource.relationships)) {
      if (!rel.data) {
        result[key] = null;
        continue;
      }

      if (Array.isArray(rel.data)) {
        result[key] = rel.data.map((ref) => {
          const included = includedMap.get(`${ref.type}:${ref.id}`);
          if (included) {
            const deserialized = deserializeResource(included, includedMap, depth + 1);
            if (ref.meta) {
              deserialized.meta = ref.meta;
            }
            return deserialized;
          }
          return { type: ref.type, id: ref.id, ...(ref.meta ? { meta: ref.meta } : {}) };
        });
      } else {
        const ref = rel.data;
        const included = includedMap.get(`${ref.type}:${ref.id}`);
        if (included) {
          const deserialized = deserializeResource(included, includedMap, depth + 1);
          if (ref.meta) {
            deserialized.meta = ref.meta;
          }
          result[key] = deserialized;
        } else {
          result[key] = { type: ref.type, id: ref.id, ...(ref.meta ? { meta: ref.meta } : {}) };
        }
      }
    }
  }

  return result;
}
