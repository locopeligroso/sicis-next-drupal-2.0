import { test, expect } from '@playwright/test';

test.describe('Editorial pages (content/{nid} + blocks/{nid})', () => {
  test('IT /chi-siamo renders title and paragraph blocks', async ({ page }) => {
    await page.goto('/it/chi-siamo');
    await expect(page).toHaveTitle(/chi siamo/i);
    // GenIntro block should render the formatted title
    await expect(page.locator('text=La forza dell')).toBeVisible();
    // At least one image should be rendered from blocks
    const images = page
      .locator('img')
      .filter({ hasNot: page.locator('[alt="SICIS"]') });
    await expect(images.first()).toBeVisible();
  });

  test('EN /who-we-are renders translated content', async ({ page }) => {
    await page.goto('/en/who-we-are');
    await expect(page.locator('text=The strength of')).toBeVisible();
  });

  test('FR /qui-sommes-nous renders', async ({ page }) => {
    const response = await page.goto('/fr/qui-sommes-nous');
    expect(response?.status()).toBe(200);
  });

  test('DE /wer-wir-sind renders', async ({ page }) => {
    const response = await page.goto('/de/wer-wir-sind');
    expect(response?.status()).toBe(200);
  });

  test('IT /contatti renders', async ({ page }) => {
    const response = await page.goto('/it/contatti');
    expect(response?.status()).toBe(200);
  });
});

test.describe('Product hub pages (new endpoints)', () => {
  test('IT /arredo shows category cards', async ({ page }) => {
    await page.goto('/it/arredo');
    await expect(page.locator('text=Divani')).toBeVisible();
    await expect(page.locator('text=Sedute')).toBeVisible();
  });

  test('IT /illuminazione shows 4 categories', async ({ page }) => {
    await page.goto('/it/illuminazione');
    await expect(page.locator('text=Lampadari')).toBeVisible();
    await expect(page.locator('text=Lampade da tavolo')).toBeVisible();
  });

  test('FR /eclairage shows categories (was broken before fix)', async ({
    page,
  }) => {
    await page.goto('/fr/%C3%A9clairage');
    const response = await page.goto('/fr/%C3%A9clairage');
    expect(response?.status()).toBe(200);
    // Should have category cards, not error page
    await expect(page.locator('text=Explore')).toBeVisible();
  });

  test('IT /lastre-vetro-vetrite shows vetrite colors and collections', async ({
    page,
  }) => {
    await page.goto('/it/lastre-vetro-vetrite');
    // Should show vetrite colors, NOT mosaic colors
    await expect(page.locator('text=Azzurro')).toBeVisible();
    // Should NOT show mosaic colors
    await expect(page.locator('text=Dorati')).not.toBeVisible();
  });

  test('IT /arredo/sedute shows products', async ({ page }) => {
    await page.goto('/it/arredo/sedute');
    const response = await page.goto('/it/arredo/sedute');
    expect(response?.status()).toBe(200);
  });

  test('IT /illuminazione/lampade-da-tavolo/amalasonte product detail', async ({
    page,
  }) => {
    const response = await page.goto(
      '/it/illuminazione/lampade-da-tavolo/amalasonte',
    );
    expect(response?.status()).toBe(200);
    await expect(page.locator('text=Amalasonte')).toBeVisible();
  });
});

test.describe('Tessili hub deduplication', () => {
  test('IT /prodotti-tessili shows each category once', async ({ page }) => {
    await page.goto('/it/prodotti-tessili');
    // Each category should appear exactly once as a card
    const arazziLinks = page.locator('a[href*="/prodotti-tessili/arazzi"]');
    await expect(arazziLinks).toHaveCount(1);
  });
});
