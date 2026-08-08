import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { EXPERIENCES } from '../utils/constants';

export interface RouteSEOOptions {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  preloadImages?: string[];
}

const DEFAULT_KEYWORDS =
  'Adventure Club in joywatersports varkala parasailing, Joy Water Sports Varkala, adventure activities in varkala, parasailing varkala, adventure sports in varkala, jet ski in varkala, varkala tourist places, adventure club varkala, Papanasam beach water sports';

const BASE_URL = 'https://joywatersports.com';

/**
 * Custom hook that dynamically updates page document titles and meta descriptions
 * based on the current active route and parameters to improve SEO for specific activity pages and routes.
 */
export function useRouteSEO(overrideOptions?: RouteSEOOptions) {
  const location = useLocation();
  const params = useParams<{ id?: string }>();

  useEffect(() => {
    const path = location.pathname;
    let title = overrideOptions?.title;
    let description = overrideOptions?.description;
    let keywords = overrideOptions?.keywords || DEFAULT_KEYWORDS;
    let canonicalUrl = overrideOptions?.canonicalUrl || `${BASE_URL}${path}`;
    let ogImage = overrideOptions?.ogImage || 'https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/parasailingmain.png';
    const ogType = overrideOptions?.ogType || 'website';

    // Dynamic resolution based on route if title or description not explicitly passed
    if (!title || !description) {
      if (path.startsWith('/activity/')) {
        const activityId = params.id || path.replace('/activity/', '');
        const experience = EXPERIENCES.find((exp) => exp.id === activityId);

        if (experience) {
          if (activityId === 'parasailing') {
            title = title || `Parasailing in Varkala | Joy Water Sports Adventure Club | Papanasam Beach`;
            description =
              description ||
              `Book Parasailing in Varkala with Joy Water Sports Adventure Club at Papanasam Beach (₹${experience.price}). Highest rated parasailing ride & adventure activities in Varkala. Certified safety.`;
            keywords =
              'Adventure Club in joywatersports varkala parasailing, parasailing in varkala, Joy Water Sports adventure club, adventure activities in varkala, parasailing varkala price, varkala parasailing cost';
          } else {
            title = title || `${experience.title} in Varkala | Joy Water Sports Adventure Club Papanasam Beach`;
            description =
              description ||
              `Experience ${experience.title} at Papanasam Beach, Varkala. ${experience.description} Book top adventure activities in Varkala with Joy Water Sports.`;
            keywords = `${experience.title} Varkala, ${experience.title} Papanasam beach, adventure activities in varkala, water sports Varkala price, ${experience.title} cost Varkala`;
          }
          ogImage = experience.image;
        } else {
          title = title || 'Water Sports & Adventure Activities in Varkala | Joy Water Sports Adventure Club';
          description = description || 'Explore thrilling adventure activities in Varkala at Papanasam Beach. Parasailing, Jet Ski, Speed Boat, and more.';
        }
      } else if (path === '/things-to-do-in-varkala') {
        title = title || 'Top 10 Things to Do & Adventure Activities in Varkala Beach | Joy Water Sports';
        description =
          description ||
          'Discover top tourist activities, unique places to visit, and adventure activities in Varkala, Kerala. Parasailing with Joy Water Sports Adventure Club, Jet Skiing, cliff views, and beach guide.';
        keywords = 'things to do in varkala, adventure activities in varkala, varkala tourist places, varkala places to visit, parasailing varkala adventure club';
      } else if (path === '/best-time-to-visit-varkala') {
        title = title || 'Best Time to Visit Varkala for Parasailing & Water Sports | Joy Water Sports';
        description =
          description ||
          'Planning a trip to Varkala? Learn about the best months, sea weather conditions, pricing, and top parasailing adventure activities on Papanasam Beach, Kerala.';
        keywords = 'best time to visit varkala for water sports, varkala weather water sports, Papanasam beach water sports season, adventure club varkala parasailing';
      } else if (path === '/declaration') {
        title = title || 'Safety Waiver & Declaration Form | Joy Water Sports Adventure Club Varkala';
        description =
          description ||
          'Complete your mandatory safety waiver and indemnity declaration form for parasailing, jet ski, and water sports at Papanasam Beach, Varkala.';
      } else if (path.startsWith('/ticket/')) {
        title = title || 'Booking Voucher & E-Ticket | Joy Water Sports Varkala';
        description = description || 'Digital booking confirmation voucher and QR code ticket for water sports at Joy Water Sports Varkala.';
      } else {
        // Default Homepage metadata
        title = title || 'Joy Water Sports Varkala | Parasailing & Adventure Activities at Papanasam Beach';
        description =
          description ||
          'Joy Water Sports Adventure Club in Varkala at Papanasam Beach. Book Parasailing (₹2500), Jet Ski (₹700), Flying Fish, Speed Boat, Banana Boat rides & Action Camera rentals.';
      }
    }

    // 1. Update Document Title
    document.title = title;

    // Helper to safely update or insert meta tags
    const updateMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to update canonical link
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalUrl);

    // 2. Set standard Meta Tags
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);

    // 3. Set Open Graph Meta Tags
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'og:image', ogImage);
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:site_name', 'Joy Water Sports Varkala');

    // 4. Set Twitter Card Meta Tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', ogImage);

    // 5. Lighthouse LCP Optimization: Inject High-Priority Image Preloads
    const imagesToPreload = overrideOptions?.preloadImages && overrideOptions.preloadImages.length > 0 
      ? overrideOptions.preloadImages 
      : [ogImage];

    // Remove stale dynamic SEO preload tags
    const existingDynamicPreloads = Array.from(document.querySelectorAll('link[data-seo-preload="true"]'));
    existingDynamicPreloads.forEach((el) => el.remove());

    imagesToPreload.forEach((imgUrl, idx) => {
      if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
        let preloadLink = document.querySelector(`link[rel="preload"][href="${imgUrl}"]`) as HTMLLinkElement;
        if (!preloadLink) {
          preloadLink = document.createElement('link');
          preloadLink.setAttribute('rel', 'preload');
          preloadLink.setAttribute('as', 'image');
          preloadLink.setAttribute('href', imgUrl);
          preloadLink.setAttribute('fetchpriority', idx === 0 ? 'high' : 'auto');
          preloadLink.setAttribute('data-seo-preload', 'true');
          document.head.appendChild(preloadLink);
        }
      }
    });
  }, [location.pathname, params.id, overrideOptions?.title, overrideOptions?.description, overrideOptions?.canonicalUrl, overrideOptions?.ogImage, overrideOptions?.preloadImages]);
}

export default useRouteSEO;
