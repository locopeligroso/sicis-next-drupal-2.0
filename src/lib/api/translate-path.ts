import { apiGet } from './client';
import type { TranslatePathResponse } from './types';

export async function getTranslatedPath(
  path: string,
  fromLocale: string,
  toLocale: string,
): Promise<string | null> {
  const result = await apiGet<TranslatePathResponse>(
    `/${fromLocale}/translate-path`,
    { path, from: fromLocale, to: toLocale },
    3600,
  );
  return result?.translatedPath ?? null;
}
