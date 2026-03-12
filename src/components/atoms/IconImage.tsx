import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

interface Props {
  source: ImageSourcePropType;
  size?: number;
  style?: StyleProp<ImageStyle>;
}

const IconImage: React.FC<Props> = ({ source, size = 24, style }) => (
  <Image
    source={source}
    style={[{ width: size, height: size }, style]}
    resizeMode="contain"
  />
);

export default React.memo(IconImage);
