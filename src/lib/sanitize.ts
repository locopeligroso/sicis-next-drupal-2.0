import sanitize from 'sanitize-html';

const SANITIZE_OPTIONS: sanitize.IOptions = {
  allowedTags: sanitize.defaults.allowedTags.concat([
    'img',
    'figure',
    'figcaption',
    'video',
    'source',
    'iframe',
    'span',
  ]),
  allowedAttributes: {
    ...sanitize.defaults.allowedAttributes,
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    iframe: ['src', 'width', 'height', 'frameborder', 'allowfullscreen', 'title'],
    span: ['class', 'style'],
    div: ['class', 'style'],
    p: ['class', 'style'],
    a: ['href', 'name', 'target', 'rel', 'class'],
    '*': ['id', 'class'],
  },
  allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
};

/**
 * Sanitize HTML from Drupal processed text fields.
 * Strips scripts, event handlers, and dangerous tags while preserving
 * common content markup (images, iframes, formatting).
 */
export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, SANITIZE_OPTIONS);
}
