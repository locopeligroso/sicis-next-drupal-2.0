# Redirect Inventory — Sicis Next.js Frontend

> **Scopo**: Documentazione di tutti i redirect presenti nel frontend.
> I redirect temporanei (marcati con ⏳) vanno rimossi quando il backend Drupal sarà aggiornato.
> Ultimo aggiornamento: 2026-03-18

---

## ⏳ REDIRECT TEMPORANEI (da rimuovere)

### TEMP_MENU_REDIRECTS

**File**: `src/app/[locale]/[...slug]/page.tsx` — righe 5–22  
**Tipo**: `redirect()` — Next.js server redirect  
**Motivo**: Workaround per alias menu Drupal non aggiornati  
**TODO**: Rimuovere quando il collega aggiorna gli alias nel menu Drupal  
**Condizione di rimozione**: Verificare che Drupal redirect module gestisca questi path per ogni lingua

#### Mappatura completa

| Slug errato | Locale | Destinazione corretta |
|-------------|--------|-----------------------|
| `/it/vetrite` | it | `/it/lastre-vetro-vetrite` |
| `/en/vetrite` | en | `/en/vetrite-glass-slabs` |
| `/fr/vetrite` | fr | `/fr/plaque-en-verre-vetrite` |
| `/de/vetrite` | de | `/de/glasscheibe-vetrite` |
| `/es/vetrite` | es | `/es/láminas-de-vidrio-vetrite` |
| `/ru/vetrite` | ru | `/ru/стеклянные-листы-vetrite` |
| `/it/textile` | it | `/it/tessile/tessuti` |
| `/en/textile` | en | `/en/textile/fabrics` |
| `/fr/textile` | fr | `/fr/textile/tissus` |
| `/de/textile` | de | `/de/textile/stoffe` |
| `/es/textile` | es | `/es/textile/telas` |
| `/ru/textile` | ru | `/ru/textile/fabrics` ⚠️ fallback EN — nessun path RU trovato |

#### Logica di attivazione (righe 117–121)

```typescript
const singleSlug = slug.length === 1 ? slug[0] : null;
if (singleSlug && TEMP_MENU_REDIRECTS[singleSlug]) {
  const target = TEMP_MENU_REDIRECTS[singleSlug][locale] ?? TEMP_MENU_REDIRECTS[singleSlug]['en'];
  redirect(`/${locale}/${target}`);
}
```

---

## ✅ REDIRECT PERMANENTI (non rimuovere)

### Middleware locale prefix redirect

**File**: `src/middleware.ts` — righe 1–8  
**Tipo**: Implicit redirect via next-intl middleware  
**Comportamento**: Qualsiasi URL senza prefisso locale viene reindirizzato a `/{defaultLocale}/`  
**Esempio**: `GET /` → `GET /it/`  
**Motivo**: Richiesto da `localePrefix: 'always'` — comportamento corretto

### notFound() su locale invalido

**File**: `src/i18n/request.ts` — riga 12  
**File**: `src/app/[locale]/layout.tsx` — riga 28  
**Tipo**: `notFound()` → 404  
**Comportamento**: Locale non in `['it', 'en', 'fr', 'de', 'es', 'ru']` → 404  
**Motivo**: Difesa corretta contro URL con locale inesistente

### notFound() su risorsa non trovata

**File**: `src/app/[locale]/[...slug]/page.tsx` — riga 172  
**Tipo**: `notFound()` → 404  
**Comportamento**: Path Drupal non risolto + nessuna section config → 404  
**Motivo**: Comportamento corretto per contenuto non esistente

---

## 🔍 NAVIGAZIONE CLIENT-SIDE (non sono redirect HTTP)

### router.push() per filtri e paginazione

**File**: `src/hooks/use-filter-sync.ts` — righe 46, 50, 62, 73, 78, 85  
**Tipo**: `router.push()` — navigazione client-side  
**Comportamento**: Aggiorna URL con filtri attivi e numero pagina  
**Note**: Non sono redirect HTTP. Verificare che preservino il prefisso locale.

### Link componenti con locale

| File | Riga | href | Note |
|------|------|------|------|
| `src/components/layout/Header.tsx` | 60 | `/${locale}` | Logo → homepage locale corrente |
| `src/components/layout/Header.tsx` | 93, 133 | Menu items | URL normalizzati con locale da Drupal |
| `src/components/layout/Footer.tsx` | 249 | `/${lang}` | ⚠️ Language switcher → sempre homepage |
| `src/components/layout/Footer.tsx` | 207, 222 | Footer links | URL con prefisso locale |
| `src/components/ProductListing.tsx` | 21, 24, 122, 148, 171 | Product cards + paginazione | `/${locale}${product.path}` |
| `src/components/nodes/Categoria.tsx` | 20–22, 25 | Product cards | `/${locale}${path}` |
| `src/components/nodes/ProdottoMosaico.tsx` | 109 | Collection link | `/${locale}${collectionPath}` |
| `src/components/nodes/ProdottoVetrite.tsx` | 56 | Collection link | `/${locale}${collectionPath}` |
| `src/app/[locale]/not-found.tsx` | 31 | `/` | Link home da 404 (middleware aggiunge locale) |

---

## 📋 CHECKLIST RIMOZIONE TEMP_MENU_REDIRECTS

Prima di rimuovere il blocco `TEMP_MENU_REDIRECTS`:

- [ ] Il collega backend ha aggiornato gli alias nel menu Drupal
- [ ] Verificare: `GET /it/router/translate-path?path=/vetrite` → risposta corretta
- [ ] Verificare: `GET /en/router/translate-path?path=/vetrite` → risposta corretta
- [ ] Verificare che Drupal redirect module gestisca `/vetrite` → `/lastre-vetro-vetrite` (IT)
- [ ] Verificare che Drupal redirect module gestisca `/vetrite` → `/vetrite-glass-slabs` (EN)
- [ ] Verificare tutti e 6 i locale per entrambi i slug (`vetrite`, `textile`)
- [ ] Trovare un path RU corretto per `textile` (attualmente usa fallback EN)
- [ ] Test smoke su tutti i path coinvolti in produzione
- [ ] Rimuovere il blocco `TEMP_MENU_REDIRECTS` (righe 5–22) e la logica (righe 117–121)
- [ ] Commit con messaggio: `fix: remove TEMP_MENU_REDIRECTS — Drupal aliases updated`

---

## 🗂️ SUMMARY TABLE

| File | Riga | Tipo | Permanente? | Azione |
|------|------|------|-------------|--------|
| `[...slug]/page.tsx` | 5–22 | TEMP_MENU_REDIRECTS | ⏳ No | Rimuovere dopo fix Drupal |
| `[...slug]/page.tsx` | 117–121 | redirect() logic | ⏳ No | Rimuovere con il blocco sopra |
| `middleware.ts` | 1–8 | next-intl locale prefix | ✅ Sì | Non toccare |
| `i18n/request.ts` | 12 | notFound() locale | ✅ Sì | Non toccare |
| `layout.tsx` | 28 | notFound() locale | ✅ Sì | Non toccare |
| `[...slug]/page.tsx` | 172 | notFound() risorsa | ✅ Sì | Non toccare |
| `use-filter-sync.ts` | 46,50,62,73,78,85 | router.push() | ✅ Sì | Verificare locale preservation |
| `Footer.tsx` | 249 | Link `/${lang}` | ⚠️ Bug | Fix language switcher (Fase 2) |
