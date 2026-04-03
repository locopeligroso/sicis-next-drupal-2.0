#!/usr/bin/env node
/**
 * Post-deploy warmup — primes ISR caches by fetching key pages.
 *
 * Usage:
 *   node scripts/warmup.mjs --quick                         # homepages + listings (~20 URLs)
 *   node scripts/warmup.mjs                                 # full warmup (~60 URLs)
 *   node scripts/warmup.mjs --base https://example.com      # custom base URL
 *   node scripts/warmup.mjs --quick --base https://example.com
 */

const args = process.argv.slice(2);
const quick = args.includes('--quick');
const baseIdx = args.indexOf('--base');
const base = (
  baseIdx !== -1 && args[baseIdx + 1]
    ? args[baseIdx + 1]
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
).replace(/\/$/, '');

const CONCURRENCY = 5;

// ── URL lists ────────────────────────────────────────────────────────────────

const LOCALES = ['it', 'en', 'fr', 'de', 'es', 'ru', 'us'];

const homepages = LOCALES.map((l) => `/${l}`);

const listings = [
  '/it/mosaico',
  '/en/mosaic',
  '/it/lastre-vetro-vetrite',
  '/en/vetrite-glass-slabs',
  '/it/arredo',
  '/en/furniture-and-accessories',
  '/it/prodotti-tessili',
  '/it/pixall',
  '/it/illuminazione',
  '/en/lighting',
];

const products = [
  '/it/mosaico/glimmer/102-mango',
  '/it/lastre-vetro-vetrite/vetrite/alma',
  '/it/arredo/divani/amaretto-sofa',
  '/it/tessile/tessuti/acaram',
  '/it/pixall/allegra',
  '/it/illuminazione/lampadari/amaretto-lampada-sospensione',
  '/en/mosaic/glimmer/102-mango',
  '/en/vetrite-glass-slabs/vetrite/alma',
  '/en/furniture-and-accessories/sofas/amaretto-sofa',
];

const pages = [
  '/it/contatti',
  '/it/progetti',
  '/en/projects',
];

// ── Build final URL list ─────────────────────────────────────────────────────

const urls = quick
  ? [...homepages, ...listings]
  : [...homepages, ...listings, ...products, ...pages];

// ── Fetch with concurrency ───────────────────────────────────────────────────

async function fetchUrl(path) {
  const url = `${base}${path}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'sicis-warmup/1.0' },
      signal: AbortSignal.timeout(60000),
    });
    const ms = Date.now() - start;
    const ok = res.status >= 200 && res.status < 400;
    // Consume body to ensure connection is fully completed
    await res.text();
    return { path, status: res.status, ms, ok };
  } catch (err) {
    const ms = Date.now() - start;
    return { path, status: 0, ms, ok: false, error: err.message };
  }
}

async function run() {
  const mode = quick ? 'quick' : 'full';
  console.log(`\n🔥 Warmup (${mode}) — ${urls.length} URLs → ${base}\n`);

  const results = [];
  const totalStart = Date.now();

  // Process in batches of CONCURRENCY
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(fetchUrl));
    for (const r of batchResults) {
      results.push(r);
      const icon = r.ok ? '✅' : '❌';
      const status = r.status || 'ERR';
      const extra = r.error ? ` (${r.error})` : '';
      console.log(`  ${icon} ${status}  ${r.ms}ms  ${r.path}${extra}`);
    }
  }

  const totalMs = Date.now() - totalStart;
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log(`\n📊 Done in ${(totalMs / 1000).toFixed(1)}s — ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run();
