import { ScrollView, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, sizes } from "@/src/shared/designSystem";
import { ProductCategory } from "@/src/shared/typesAndInterfaces";
import { FC } from "react";

interface CategoryPillsProps {
  categories: ProductCategory[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  showAllOption?: boolean;
}

export const CategoryPills: FC<CategoryPillsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  showAllOption = true,
}) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {showAllOption && (
        <TouchableOpacity
          style={[styles.pill, selectedCategory === "" && styles.activePill]}
          onPress={() => onSelectCategory("")}
        >
          <Text style={styles.pillText}>All</Text>
        </TouchableOpacity>
      )}
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.pill, cat.label === selectedCategory && styles.activePill]}
          onPress={() => {
            onSelectCategory(cat.label === selectedCategory ? "" : cat.label);
          }}
        >
          <Text style={styles.pillText}>{cat.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: sizes.m,
  },
  pill: {
    backgroundColor: colors.white,
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    borderRadius: 20,
    marginRight: sizes.s,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  activePill: {
    borderColor: colors.black,
    borderWidth: 1.5,
  },
  pillText: {
    color: colors.text,
    fontWeight: "500",
  },
});
