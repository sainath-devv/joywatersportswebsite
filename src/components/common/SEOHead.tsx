import React, { useEffect } from 'react';
import useRouteSEO from '../../hooks/useRouteSEO';

interface SEOProps {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  keywords?: string;
  preloadImages?: string[];
  schema?: object | object[];
}

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  keywords,
  preloadImages,
  schema
}) => {
  // Leverage custom useRouteSEO hook to dynamically update title & metadata based on current active route
  useRouteSEO({
    title,
    description,
    canonicalUrl,
    ogImage,
    ogType: ogType as 'website' | 'article' | 'product',
    keywords,
    preloadImages
  });

  useEffect(() => {
    // Inject / Update JSON-LD Structured Data Schema
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
  }, [schema]);

  return null;
};

// Global Default LocalBusiness Schema for Joy Water Sports Varkala
export const joyWaterSportsBusinessSchema = {
  '@type': ['SportsActivityLocation', 'LocalBusiness', 'TouristAttraction', 'TravelAgency'],
  '@id': 'https://joywatersports.com/#organization',
  name: 'Joy Water Sports Varkala',
  alternateName: [
    'Joy Water Sports',
    'Joy Water Sports Adventure Club',
    'Adventure Club in Joy Water Sports Varkala',
    'Joy Water Sports Parasailing Varkala',
    'Joy Water Sports Papanasam Beach'
  ],
  url: 'https://joywatersports.com',
  logo: {
    '@type': 'ImageObject',
    url: 'https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx',
    caption: 'Joy Water Sports Adventure Club Logo Varkala'
  },
  image: [
    'https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/parasailingmain.png',
    'https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/jetski.png',
    'https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/jws1.png',
    'https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx'
  ],
  telephone: '+919400000000', // Business phone number
  priceRange: '₹300 - ₹4500',
  description: 'Joy Water Sports Adventure Club Varkala is the premier beach adventure center at Papanasam Beach, Varkala. Best price for parasailing in Varkala, jet ski, speed boat, banana boat, flying fish, and top adventure activities in Varkala.',
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
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Varkala Water Sports & Adventure Activities Catalog',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Parasailing in Varkala - Joy Water Sports Adventure Club',
          description: 'High-flying tandem and solo parasailing ride 300ft over Papanasam Beach with certified safety equipment.',
          image: 'https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/parasailingmain.png'
        },
        price: '2500',
        priceCurrency: 'INR'
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Jet Ski Ride Varkala',
          description: 'High-speed jet skiing across Arabian Sea waves in Varkala Beach.',
          image: 'https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/jetski.png'
        },
        price: '700',
        priceCurrency: 'INR'
      }
    ]
  },
  sameAs: [
    'https://www.google.com/maps?cid=1234567890',
    'https://www.instagram.com/joywatersports_varkala'
  ]
};

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export const createBreadcrumbSchema = (items: BreadcrumbItem[]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url.startsWith('http')
      ? item.url
      : `https://joywatersports.com${item.url.startsWith('/') ? '' : '/'}${item.url}`
  }))
});

export default SEOHead;
