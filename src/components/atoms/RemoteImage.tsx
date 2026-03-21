import React from 'react';
import { Image, ImageStyle, StyleProp, View } from 'react-native';

interface RemoteImageProps {
  uri: string | null | undefined;
  style: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}

/**
 * Safe remote image — guards against null/undefined/empty URI which crashes
 * iOS Fabric (New Architecture) with "URI parsing error".
 */
const RemoteImage: React.FC<RemoteImageProps> = ({ uri, style, resizeMode = 'cover' }) => {
  if (!uri) return <View style={style} />;
  return <Image source={{ uri }} style={style} resizeMode={resizeMode} />;
};

export default React.memo(RemoteImage);
