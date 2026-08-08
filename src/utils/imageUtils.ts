/**
 * Utility functions for generating responsive image attributes (srcSet, sizes, fetchPriority)
 * to maximize PageSpeed / Core Web Vitals scores.
 */

export interface ImageAttributes {
  src: string;
  srcSet?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Builds responsive srcSet for various image hosts (Unsplash, Supabase, Google CDN)
 */
export function buildSrcSet(url: string): string | undefined {
  if (!url || typeof url !== 'string') return undefined;

  // Unsplash Images
  if (url.includes('images.unsplash.com')) {
    const baseUrl = url.split('?')[0];
    const widths = [360, 640, 960, 1280, 1600];
    return widths
      .map((w) => `${baseUrl}?auto=format&fit=crop&q=80&w=${w} ${w}w`)
      .join(', ');
  }

  // Supabase Storage Images
  if (url.includes('supabase.co/storage')) {
    const baseUrl = url.split('?')[0];
    const widths = [360, 640, 960, 1280, 1600];
    return widths
      .map((w) => `${baseUrl}?width=${w}&quality=80 ${w}w`)
      .join(', ');
  }

  // Google Drive / lh3 CDN
  if (url.includes('lh3.googleusercontent.com')) {
    const baseUrl = url.split('=')[0];
    const widths = [120, 240, 480, 800, 1200];
    return widths
      .map((w) => `${baseUrl}=w${w} ${w}w`)
      .join(', ');
  }

  return undefined;
}

/**
 * Generates standardized image attributes for maximum performance
 */
export function getResponsiveImageProps(
  src: string,
  options?: {
    sizes?: string;
    isPriority?: boolean;
    defaultSizes?: string;
  }
): ImageAttributes {
  const {
    sizes = options?.defaultSizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    isPriority = false,
  } = options || {};

  const srcSet = buildSrcSet(src);

  return {
    src,
    srcSet,
    sizes: srcSet ? sizes : undefined,
    loading: isPriority ? 'eager' : 'lazy',
    decoding: 'async',
    fetchPriority: isPriority ? 'high' : 'low',
  };
}
