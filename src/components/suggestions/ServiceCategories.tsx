import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@themes/colors';
import { AffiliateCategory } from '../../types';
import { SERVICE_CATEGORIES } from '../../data/affiliateProducts';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

interface ServiceCategoriesProps {
  onCategoryPress: (category: AffiliateCategory) => void;
}

const ServiceCategories: React.FC<ServiceCategoriesProps> = ({ onCategoryPress }) => {
  const styles = useStyles();
  const colors = useColors();


  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Khám phá theo danh mục</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {SERVICE_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryItem}
            onPress={() => onCategoryPress(cat.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: cat.color }]}>
              <Ionicons name={cat.icon as any} size={26} color={colors.white} />
            </View>
            <Text style={styles.label}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const useStyles = makeStyles((colors) => ({
  container: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Manrope_700Bold',
    color: colors.textPrimary,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: 72,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
}));export default React.memo(ServiceCategories);
