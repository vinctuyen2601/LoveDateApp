import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useColors, ColorScheme } from '@contexts/ThemeContext';

/**
 * Factory tạo themed StyleSheet.
 *
 * @example
 * const useStyles = makeStyles((colors) => ({
 *   container: { backgroundColor: colors.background },
 * }));
 *
 * // Trong component:
 * const styles = useStyles();
 */
export const makeStyles = <T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ColorScheme) => T,
) => (): T => {
  const colors = useColors();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
};
