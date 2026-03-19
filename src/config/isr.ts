/** ISR revalidation times in seconds — single source of truth */
export const ISR = {
  PRODUCTS: 60,
  EDITORIAL: 300,
  PAGES: 600,
  TAXONOMY: 3600,
  MENU: 600,
  FILTER_OPTIONS: 3600,
} as const;
