import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  keywords?: string;
  schema?: object | object[];
}

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  canonicalUrl = 'https://joywatersports.com',
  ogImage = 'https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx',
  ogType = 'website',
  keywords = 'Joy Water Sports Varkala, water sports in varkala, parasailing varkala, jet ski in varkala, varkala tourist places, adventure activities in varkala, varkala things to do, varkala places to visit, unique places to visit in varkala, Papanasam beach water sports',
  schema
}) => {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // Helper function to update or create meta tags
    const updateMeta = (nameAttr: string, attrValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${nameAttr}="${attrValue}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(nameAttr, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    // Helper to update canonical link tag
    let canonicalElement = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.setAttribute('href', canonicalUrl);

    // 2. Standard Meta Tags
    updateMeta('name', 'description', description);
    updateMeta('name', 'keywords', keywords);

    // 3. Open Graph Social Meta Tags
    updateMeta('property', 'og:title', title);
    updateMeta('property', 'og:description', description);
    updateMeta('property', 'og:url', canonicalUrl);
    updateMeta('property', 'og:image', ogImage);
    updateMeta('property', 'og:type', ogType);
    updateMeta('property', 'og:site_name', 'Joy Water Sports Varkala');

    // 4. Twitter Card Meta Tags
    updateMeta('name', 'twitter:card', 'summary_large_image');
    updateMeta('name', 'twitter:title', title);
    updateMeta('name', 'twitter:description', description);
    updateMeta('name', 'twitter:image', ogImage);

    // 5. Inject / Update JSON-LD Structured Data Schema
    const scriptId = 'json-ld-seo-schema';
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement;

    if (!scriptElement) {
      scriptElement = document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }

    if (schema) {
      const formattedSchema = Array.isArray(schema) 
        ? { '@context': 'https://schema.org', '@graph': schema } 
        : { '@context': 'https://schema.org', ...schema };
      scriptElement.textContent = JSON.stringify(formattedSchema, null, 2);
    } else {
      scriptElement.textContent = '';
    }

    return () => {
      // Optional cleanup if needed
    };
  }, [title, description, canonicalUrl, ogImage, ogType, keywords, schema]);

  return null;
};

// Global Default LocalBusiness Schema for Joy Water Sports Varkala
export const joyWaterSportsBusinessSchema = {
  '@type': ['SportsActivityLocation', 'LocalBusiness', 'TouristAttraction'],
  '@id': 'https://joywatersports.com/#organization',
  name: 'Joy Water Sports Varkala',
  alternateName: ['Joy Water Sports', 'Joy Water Sports Papanasam Beach'],
  url: 'https://joywatersports.com',
  logo: 'https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx',
  image: 'https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx',
  telephone: '+919400000000', // Business phone number
  priceRange: '₹300 - ₹4500',
  description: 'Book top-rated water sports in Varkala with Joy Water Sports Varkala! Best price for parasailing varkala, jet ski in varkala, speed boat rides, banana rides, flying fish, and complete beach adventure packages at Papanasam Beach.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Papanasam Beach, North Cliff Shoreline',
    addressLocality: 'Varkala',
    addressRegion: 'Kerala',
    postalCode: '695141',
    addressCountry: 'IN'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 8.7379,
    longitude: 76.7163
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '09:00',
      closes: '18:00'
    }
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '342',
    bestRating: '5',
    worstRating: '1'
  },
  sameAs: [
    'https://www.google.com/maps?cid=1234567890',
    'https://www.instagram.com/joywatersports_varkala'
  ]
};

export default SEOHead;
