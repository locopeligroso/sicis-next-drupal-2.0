// ════════════════════════════════════════════════════════════════════════════
// §1  Constants (single source of truth)
// ════════════════════════════════════════════════════════════════════════════

export const DRUPAL_BASE_URL = (
  process.env.DRUPAL_BASE_URL ||
  process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ||
  'http://localhost'
).replace(/\/$/, '');

export const DRUPAL_ORIGIN = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || 'http://localhost',
    ).origin;
  } catch {
    return (
      process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || 'http://localhost'
    ).replace(/\/$/, '');
  }
})();
