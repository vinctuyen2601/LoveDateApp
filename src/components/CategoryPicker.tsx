import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventCategory, EVENT_CATEGORIES } from '../types';
import { COLORS, getCategoryColor } from '../constants/colors';

interface CategoryPickerProps {
  selectedCategory: EventCategory;
  onSelect: (category: EventCategory) => void;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({ selectedCategory, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Danh mục</Text>
      <View style={styles.optionsContainer}>
        {EVENT_CATEGORIES.map((category) => {
          const isSelected = selectedCategory === category.value;

          return (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.option,
                isSelected && styles.optionSelected,
              ]}
              onPress={() => onSelect(category.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={category.icon as any}
                size={20}
                color={isSelected ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 8,
    flex: 1,
    flexBasis: '47%',
    maxWidth: '48%',
    minWidth: 140,
  },
  optionSelected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default CategoryPicker;
