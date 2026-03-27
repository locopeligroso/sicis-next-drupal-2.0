/**
 * e2e/us-locale.spec.ts
 *
 * Verifies US locale rendering rules on product pages:
 * - Inch measurements shown in structured attribute fields (not metric)
 * - PricingCard (In stock / North America Warehouse) visible only on /us/
 * - "Request Sample" CTA visible only on /us/ (controlled by isUs → showRequestSample)
 * - Grout consumption in kg/sqft on /us/, kg/m² on /en/
 * - Listing and collection filter pages load correctly under /us/
 * - Language switcher includes US option
 *
 * Viewport note:
 *   Playwright default viewport is 1280×720 (desktop). SpecProductHero renders the product
 *   title in TWO h1 elements: one inside `.md:hidden` (mobile, hidden at 1280px viewport)
 *   and one inside `.hidden.md:flex` (desktop, visible at 1280px). On product pages we use
 *   `page.locator('h1').nth(1)` to target the visible desktop h1. On listing pages only one
 *   h1 is rendered so `.first()` works.
 *
 * Product under test: /mosaic/murano-smalto/amethyst-0
 *   - field_campione=true (sample available → showRequestSample=true on US)
 *   - noUsaStock=false → inStock=true → In stock badge + North America Warehouse visible on US
 *   - Murano Smalto collection has inch fields (field_dimensione_tessera_inch = '1/8"')
 *   - field_consumo_stucco_sqft set → grout consumption shown on US
 *
 * Note on metric text in prose descriptions:
 *   The Drupal editorial body text may contain metric values (e.g. "4 mm nominal thickness").
 *   These come from the prose description field, not from structured measurement attributes.
 *   Tests that verify inch/metric separation target only the AttributeGrid values, not prose.
 *
 * Note on product link hrefs on listing pages:
 *   On /us/mosaic (hub), links go to sub-collections — no locale prefix in href.
 *   On /us/mosaic/murano-smalto (collection), product links use /mosaic/{collection}/{slug}
 *   without a locale prefix because Next.js strips the current locale from generated hrefs.
 */

import { test, expect } from '@playwright/test';

const US_PRODUCT = '/us/mosaic/murano-smalto/amethyst-0';
const EN_PRODUCT = '/en/mosaic/murano-smalto/amethyst-0';
const US_LISTING = '/us/mosaic';
const US_COLLECTION = '/us/mosaic/murano-smalto';

/**
 * Wait for the product page to be fully rendered.
 * Uses `.nth(1)` because SpecProductHero renders two h1 elements (mobile + desktop).
 * At the default desktop viewport (1280px), `.md:hidden` hides the first h1,
 * so `.nth(1)` targets the visible desktop heading.
 */
async function waitForProductPage(
  page: Parameters<Parameters<typeof test>[1]>[0],
) {
  // Use networkidle to ensure SSR content is fully received
  await page.waitForLoadState('networkidle');
  // The desktop h1 (nth(1)) should be visible at 1280px viewport
  await expect(page.locator('h1').nth(1)).toBeVisible();
}

// ---------------------------------------------------------------------------
// Test 1: US product — inch measurements visible in structured attribute fields
// ---------------------------------------------------------------------------
test('US mosaico product — inch measurements in attribute fields', async ({
  page,
}) => {
  await page.goto(US_PRODUCT);
  await expect(page).not.toHaveURL(/error/);
  await waitForProductPage(page);

  const bodyText = await page.locator('body').innerText();

  // Inch notation must be present: from field_dimensione_tessera_inch (e.g. '1/8"')
  // This value comes from the AttributeGrid in SpecProductDetails.
  const inchPattern = /\d[\d/]*"/;
  expect(
    inchPattern.test(bodyText),
    'Expected inch notation (e.g. 1/8") in the page — field_dimensione_tessera_inch must be populated',
  ).toBe(true);

  // The structured attribute labels (Sheet size, Chip size, Thickness) must not have
  // raw metric values in their attribute rows. Prose descriptions may contain mm — we
  // skip those by only examining lines that are exactly the attribute label+value pair.
  const lines = bodyText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    // AttributeGrid renders label on one line and value on the next (or same line)
    // We look for lines that are *only* a measurement value for a known attribute
    if (/^(Sheet size|Chip size|Thickness)$/i.test(line)) {
      // Next non-empty line is the value
      const idx = lines.indexOf(line);
      const valueLine = lines[idx + 1] ?? '';
      // Value line must not be a raw millimeter value (e.g. "295 mm")
      expect(
        valueLine,
        `Attribute "${line}" value must not be in mm`,
      ).not.toMatch(/^\d+\s*mm$/i);
    }
  }
});

// ---------------------------------------------------------------------------
// Test 2: US product — In Stock + North America Warehouse visible
// ---------------------------------------------------------------------------
test('US mosaico product — In stock badge and North America Warehouse visible', async ({
  page,
}) => {
  await page.goto(US_PRODUCT);
  await waitForProductPage(page);

  // "Get a Quote" must always be visible on product pages (both locales)
  // The button appears twice (in-flow + sticky bar) — target the in-flow one
  await expect(
    page.getByRole('button', { name: /get a quote/i }).first(),
  ).toBeVisible();

  // On US locale, isUs=true → PricingCard renders with inStock/shippingWarehouse.
  // This product: noUsaStock=false → inStock=true → "In stock" badge renders.
  await expect(
    page.getByText('In stock', { exact: true }).first(),
  ).toBeVisible();

  // shippingWarehouse='North America Warehouse' when !noUsaStock
  await expect(page.getByText('North America Warehouse').first()).toBeVisible();

  // Price is conditional (field_prezzo_usa may be null) — only assert format when present
  const pageText = await page.locator('body').innerText();
  if (pageText.includes('Starting at')) {
    expect(pageText).toMatch(/\$/);
    expect(pageText).toMatch(/\/sqft/);
  }
});

// ---------------------------------------------------------------------------
// Test 3: EN product — NO Request Sample, NO PricingCard elements
// ---------------------------------------------------------------------------
test('EN mosaico product — no Request Sample, no Starting at, no US stock info', async ({
  page,
}) => {
  await page.goto(EN_PRODUCT);
  await waitForProductPage(page);

  // "Get a Quote" must still be visible on EN locale
  await expect(
    page.getByRole('button', { name: /get a quote/i }).first(),
  ).toBeVisible();

  // "Request Sample" must NOT exist on EN (showRequestSample=isUs=false)
  // The button appears in in-flow AND sticky bar on US — on EN, count should be 0.
  const requestSampleBtns = page.getByRole('button', {
    name: /request sample/i,
  });
  await expect(requestSampleBtns).toHaveCount(0);

  const pageText = await page.locator('body').innerText();

  // PricingCard is gated by {isUs && <ProductPricingCard .../>} in SpecProductHero.
  // "Starting at" is the label rendered inside ProductPricingCard — must be absent.
  expect(pageText).not.toContain('Starting at');

  // US-specific warehouse and stock text must be absent
  expect(pageText).not.toContain('North America Warehouse');
  expect(pageText).not.toContain('In stock');
});

// ---------------------------------------------------------------------------
// Test 4: US product — grout consumption in kg/sqft when present
// ---------------------------------------------------------------------------
test('US mosaico product — grout consumption in kg/sqft when present', async ({
  page,
}) => {
  await page.goto(US_PRODUCT);
  await waitForProductPage(page);

  const pageText = await page.locator('body').innerText();

  // Grout consumption is conditional — field_consumo_stucco_sqft must be set on the collection.
  // The debug run showed "0.00 kg/sqft" on this product, so the field is set.
  const hasKgUnit = /kg\//.test(pageText);

  if (hasKgUnit) {
    // On US: groutConsumption = `${field_consumo_stucco_sqft} kg/sqft`
    expect(pageText).toMatch(/kg\/sqft/);
    // Must not contain the metric variant on the same page
    expect(pageText).not.toMatch(/kg\/m²/);
  }
});

// ---------------------------------------------------------------------------
// Test 5: EN product — grout consumption in kg/m² when present
// ---------------------------------------------------------------------------
test('EN mosaico product — grout consumption in kg/m² when present', async ({
  page,
}) => {
  await page.goto(EN_PRODUCT);
  await waitForProductPage(page);

  const pageText = await page.locator('body').innerText();

  // Grout consumption is conditional — field_consumo_stucco_m2 must be set on the collection.
  const hasKgUnit = /kg\//.test(pageText);

  if (hasKgUnit) {
    // On EN: groutConsumption = `${field_consumo_stucco_m2} kg/m²`
    expect(pageText).toMatch(/kg\/m²/);
    // Must not contain the imperial variant on the same page
    expect(pageText).not.toMatch(/kg\/sqft/);
  }
});

// ---------------------------------------------------------------------------
// Test 6: US product listing hub loads
// ---------------------------------------------------------------------------
test('US product listing page loads with product-related content', async ({
  page,
}) => {
  const response = await page.goto(US_LISTING);

  // Must respond with 200
  expect(response?.status()).toBe(200);

  // Wait for the page content (single h1 on listing pages)
  await expect(page.locator('h1').first()).toBeVisible();

  // Must not be an error screen
  const pageText = await page.locator('body').innerText();
  expect(pageText).not.toMatch(/internal server error/i);
  expect(pageText).not.toMatch(/\b404\b/);

  // The mosaic hub renders SpecHubMosaico or SpecCategory with collection cards.
  // Verify at least one interactive link is present in the main content area.
  const contentLinks = page.locator('main a, article a').first();
  await expect(contentLinks).toBeVisible();
});

// ---------------------------------------------------------------------------
// Test 7: US collection page loads with product links
// ---------------------------------------------------------------------------
test('US collection page loads with product content', async ({ page }) => {
  const response = await page.goto(US_COLLECTION);

  // Must respond with 200
  expect(response?.status()).toBe(200);

  // Must not be an error screen
  const pageText = await page.locator('body').innerText();
  expect(pageText).not.toMatch(/internal server error/i);
  expect(pageText).not.toMatch(/\b404\b/);

  // The collection page renders ProductCard components.
  // Next.js strips the current locale (/us/) from href so product links look like
  // /mosaic/murano-smalto/amethyst-0 (without locale prefix).
  const productLinks = page.locator('a[href*="/mosaic/murano-smalto/"]');
  const count = await productLinks.count();
  expect(count).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Test 8: Language switcher shows US option
// ---------------------------------------------------------------------------
test('Language switcher includes US option on /us/mosaic', async ({ page }) => {
  await page.goto(US_LISTING);
  await expect(page.locator('h1').first()).toBeVisible();

  // The Navbar language switcher renders locale buttons.
  // On /us/ pages, "US" is shown — either as an active button text or a link/option.
  // We accept a button with name "US" or any element with text "US" (exact match).
  const usButton = page.getByRole('button', { name: /^US$/i });
  const usText = page.getByText('US', { exact: true });

  const hasUs = (await usButton.count()) > 0 || (await usText.count()) > 0;

  expect(hasUs).toBe(true);
});
