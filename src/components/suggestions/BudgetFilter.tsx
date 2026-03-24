import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '@themes/colors';
import { BUDGET_OPTIONS } from '../../data/affiliateProducts';
import { getProductsByBudget } from '../../services/affiliateProductService';
import { AffiliateProduct } from '../../types';
import ProductCard from './ProductCard';
import { makeStyles } from '@utils/makeStyles';
import { useColors } from '@contexts/ThemeContext';

const BudgetFilter: React.FC = () => {
  const styles = useStyles();
  const colors = useColors();

  const [selectedBudget, setSelectedBudget] = useState<string>(BUDGET_OPTIONS[1]); // 200k-500k default
  const [filteredProducts, setFilteredProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async (budget: string) => {
    setLoading(true);
    try {
      const products = await getProductsByBudget(budget);
      setFilteredProducts(products.slice(0, 3));
    } catch {
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(selectedBudget);
  }, [selectedBudget, loadProducts]);

  const handleBudgetPress = (budget: string) => {
    setSelectedBudget(budget);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Gợi ý theo ngân sách</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        {BUDGET_OPTIONS.map((budget) => (
          <TouchableOpacity
            key={budget}
            style={[
              styles.chip,
              selectedBudget === budget && styles.chipActive,
            ]}
            onPress={() => handleBudgetPress(budget)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedBudget === budget && styles.chipTextActive,
              ]}
            >
              {budget}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.productsList}>
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} variant="vertical" />
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Chưa có sản phẩm cho ngân sách này</Text>
          </View>
        )}
      </View>
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
  chipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  productsList: {
    paddingHorizontal: 16,
  },
  empty: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
}));export default React.memo(BudgetFilter);
