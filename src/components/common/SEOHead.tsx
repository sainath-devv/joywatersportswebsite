import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteSEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  keywords?: string;
  preloadImages?: string[];
}

const DEFAULT_TITLE = 'Joy Water Sports Varkala | Parasailing, Jet Ski & Adventure Activities';
const DEFAULT_DESCRIPTION = 'Best price for parasailing, jet ski, speed boat, banana boat, and adventure water sports at Papanasam Beach, Varkala.';
const DEFAULT_OG_IMAGE = 'https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/parasailingmain.png';
const SITE_URL = 'https://joywatersports.com';

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  if (!content) return;
  let element = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonicalLink(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setPreloadImages(urls: string[]) {
  document
    .querySelectorAll('link[data-route-seo-preload="true"]')
    .forEach((el) => el.parentNode?.removeChild(el));

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.setAttribute('rel', 'preload');
    link.setAttribute('as', 'image');
    link.setAttribute('href', url);
    link.setAttribute('data-route-seo-preload', 'true');
    document.head.appendChild(link);
  });
}

export const useRouteSEO = ({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  keywords,
  preloadImages
}: RouteSEOProps) => {
  const location = useLocation();

  useEffect(() => {
    const resolvedTitle = title || DEFAULT_TITLE;
    const resolvedDescription = description || DEFAULT_DESCRIPTION;
    const resolvedOgImage = ogImage || DEFAULT_OG_IMAGE;
    const resolvedCanonical = canonicalUrl
      ? (canonicalUrl.startsWith('http') ? canonicalUrl : `${SITE_URL}${canonicalUrl}`)
      : `${SITE_URL}${location.pathname}`;

    document.title = resolvedTitle;

    setMetaTag('name', 'description', resolvedDescription);
    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    setMetaTag('property', 'og:title', resolvedTitle);
    setMetaTag('property', 'og:description', resolvedDescription);
    setMetaTag('property', 'og:image', resolvedOgImage);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', resolvedCanonical);

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', resolvedTitle);
    setMetaTag('name', 'twitter:description', resolvedDescription);
    setMetaTag('name', 'twitter:image', resolvedOgImage);

    setCanonicalLink(resolvedCanonical);

    if (preloadImages && preloadImages.length > 0) {
      setPreloadImages(preloadImages);
    }
  }, [
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType,
    keywords,
    preloadImages,
    location.pathname
  ]);
};

export default useRouteSEO;
