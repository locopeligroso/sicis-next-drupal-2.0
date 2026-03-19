import { env } from './env';

export const DRUPAL_BASE_URL = env.DRUPAL_BASE_URL;
export const DRUPAL_PUBLIC_URL = env.NEXT_PUBLIC_DRUPAL_BASE_URL;

export const DRUPAL_ORIGIN = (() => {
  try {
    return new URL(DRUPAL_PUBLIC_URL).origin;
  } catch {
    return DRUPAL_PUBLIC_URL.replace(/\/$/, '');
  }
})();
