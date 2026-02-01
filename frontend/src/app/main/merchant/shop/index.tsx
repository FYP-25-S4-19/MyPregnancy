import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ShopScreen from "@/src/screens/ShopScreen";
import { router } from "expo-router";
import { colors, sizes } from "@/src/shared/designSystem";

export default function MerchantShopScreen() {
  const handleMyProductsPress = () => {
    router.push("/main/merchant/shop/my-products");
  };

  const handleAddProductPress = () => {
    router.push("/main/merchant/shop/addNewProduct");
  };

  return (
    <View style={styles.container}>
      <ShopScreen onProductIdPress={(productId) => router.push(`/main/merchant/shop/${productId}`)} />

      {/* Floating Action Buttons */}
      <View style={styles.floatingButtonsContainer}>
        <TouchableOpacity style={styles.floatingButtonLeft} onPress={handleMyProductsPress} activeOpacity={0.8}>
          <Ionicons name="cube" size={28} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.floatingButtonRight} onPress={handleAddProductPress} activeOpacity={0.8}>
          <Ionicons name="add" size={32} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButtonsContainer: {
    position: "absolute",
    bottom: sizes.xl,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: sizes.l,
    zIndex: 10,
  },
  floatingButtonLeft: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  floatingButtonRight: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
