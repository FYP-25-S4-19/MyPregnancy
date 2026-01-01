import { View, StyleSheet, ScrollView, Text, TouchableOpacity, TextInput, Image } from "react-native";
import { colors, font, shadows, sizes } from "@/src/shared/designSystem";
import { Ionicons } from "@expo/vector-icons";

const DUMMY_CATEGORIES = ["All", "Snacks", "Baby Essentials", "Supplements"];
const DUMMY_PRODUCTS = [
  { id: "1", name: "Newborn Baby Clothes", price: "$60", image: "https://via.placeholder.com/150" },
  { id: "2", name: "Newborn Baby Clothes", price: "$60", image: "https://via.placeholder.com/150" },
  { id: "3", name: "Organic Snack Pack", price: "$12", image: "https://via.placeholder.com/150" },
];

export const MyProductsSection = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>My Product</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} placeholderTextColor={colors.tabIcon} />
        <Ionicons name="search" size={20} color={colors.tabIcon} style={styles.searchIcon} />
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {DUMMY_CATEGORIES.map((cat, i) => (
          <TouchableOpacity key={cat} style={[styles.pill, i === 0 && styles.activePill]}>
            <Text style={[styles.pillText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Grid */}
      <View style={styles.grid}>
        {DUMMY_PRODUCTS.map((item) => (
          <View key={item.id} style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.cardInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: sizes.m,
  },
  sectionTitle: {
    fontSize: font.l,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.m,
  },
  searchContainer: {
    backgroundColor: colors.secondary,
    borderRadius: 20,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sizes.m,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  searchInput: { flex: 1, color: colors.text },
  searchIcon: { marginLeft: sizes.s },
  categories: {
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
  pillText: { color: colors.text, fontWeight: "500" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: colors.white,
    width: "48%",
    borderRadius: sizes.borderRadius,
    marginBottom: sizes.m,
    overflow: "hidden",
    ...shadows.small,
  },
  productImage: {
    width: "100%",
    height: 120,
    backgroundColor: colors.lightGray,
  },
  cardInfo: {
    padding: sizes.s,
  },
  productName: {
    fontSize: font.s,
    fontWeight: "600",
    color: colors.text,
  },
  productPrice: {
    fontSize: font.xs,
    color: colors.text,
    marginTop: 4,
  },
});
