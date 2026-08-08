import React from 'react';
import { Image, ImageProps } from './Image';

export type ResponsiveImageProps = ImageProps;
export const ResponsiveImage: React.FC<ResponsiveImageProps> = (props) => <Image {...props} />;

export { Image };
export default ResponsiveImage;

