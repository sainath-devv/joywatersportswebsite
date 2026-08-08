import React, { useState } from 'react';
import { buildSrcSet } from '../../utils/imageUtils';

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  activityName?: string;
  sizes?: string;
  isPriority?: boolean; // Set to true for hero or above-the-fold images
  itemProp?: string;
}

/**
 * Custom Image component that automatically generates responsive `srcset` and `sizes`
 * attributes based on the image host URL, enforces lazy-loading for all non-hero images,
 * automatically derives rich `alt` tags based on activity names, and injects `itemprop`
 * attributes for schema microdata and better image indexing in Google Search results.
 */
export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  activityName,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  isPriority = false,
  className = '',
  loading,
  decoding = 'async',
  itemProp = 'image',
  onLoad,
  ...restProps
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const srcSet = buildSrcSet(src);
  const effectiveLoading = loading || (isPriority ? 'eager' : 'lazy');

  // Derive rich SEO-optimized alt attribute
  let computedAlt = alt;
  if (activityName) {
    if (alt) {
      if (alt.toLowerCase().includes(activityName.toLowerCase()) || alt.toLowerCase().includes('varkala')) {
        computedAlt = alt;
      } else {
        computedAlt = `${activityName} - ${alt} | Joy Water Sports Varkala`;
      }
    } else {
      computedAlt = `${activityName} Water Sports Activity at Joy Water Sports Varkala, Papanasam Beach`;
    }
  } else if (!computedAlt) {
    computedAlt = 'Joy Water Sports Varkala Beach Activity';
  }

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad(e);
    }
  };

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={computedAlt}
      itemProp={itemProp}
      loading={effectiveLoading}
      decoding={decoding}
      {...(isPriority ? ({ fetchPriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>) : {})}
      onLoad={handleLoad}
      className={`transition-opacity duration-300 ${isLoaded || isPriority ? 'opacity-100' : 'opacity-90'} ${className}`}
      {...restProps}
    />
  );
};

export default Image;
