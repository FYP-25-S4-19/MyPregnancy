import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, sizes, font } from "@/src/shared/designSystem";
import { useCallback } from "react";
import { router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useMyProducts, useDeleteProductMutation } from "@/src/shared/hooks/useProducts";

export default function MyProductsScreen() {
  const { data: products, isLoading: loading, refetch } = useMyProducts();
  const deleteProductMutation = useDeleteProductMutation();

  // Refetch products when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const handleDelete = async (productId: number) => {
    Alert.alert("Delete Product", "Are you sure you want to delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          deleteProductMutation.mutate(productId, {
            onSuccess: () => {
              Alert.alert("Success", "Product deleted successfully");
            },
            onError: (err: any) => {
              console.log("Failed to delete product", err);
              Alert.alert("Error", err.response?.data?.detail || "Failed to delete product");
            },
          });
        },
      },
    ]);
  };

  const handleEdit = (productId: number) => {
    router.push(`/main/merchant/shop/edit/${productId}`);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        activeOpacity={0.85}
        onPress={() => router.push(`/main/merchant/shop/${item.id}`)}
      >
        <Image source={{ uri: item.img_url }} style={styles.image} />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.category}>{item.category.toUpperCase()}</Text>

          <Text style={styles.price}>{formatPrice(item.price_cents)}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item.id)}
          activeOpacity={0.7}
          disabled={deleteProductMutation.isPending}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
          activeOpacity={0.7}
          disabled={deleteProductMutation.isPending}
        >
          {deleteProductMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.fail} />
          ) : (
            <>
              <Ionicons name="trash-outline" size={20} color={colors.fail} />
              <Text style={styles.deleteText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>MY PRODUCTS</Text>

        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !products || products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color={colors.lightGray} />
          <Text style={styles.emptyTitle}>No products yet</Text>
          <Text style={styles.emptyText}>Products you create will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
  },
  backBtn: {
    width: 40,
  },
  title: {
    fontSize: font.l,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: sizes.xl,
  },
  emptyTitle: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
    marginTop: sizes.m,
  },
  emptyText: {
    marginTop: sizes.xs,
    color: colors.tabIcon,
    textAlign: "center",
    fontSize: font.s,
  },
  listContent: {
    paddingHorizontal: sizes.l,
    paddingBottom: sizes.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.l,
    marginBottom: sizes.m,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cardContent: {
    flexDirection: "row",
    padding: sizes.m,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: sizes.m,
  },
  info: {
    flex: 1,
    marginLeft: sizes.m,
    justifyContent: "center",
  },
  name: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  category: {
    fontSize: font.xs,
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  price: {
    fontSize: font.m,
    fontWeight: "900",
    color: colors.text,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: sizes.m,
    gap: sizes.xs,
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.05)",
  },
  editText: {
    fontSize: font.s,
    color: colors.primary,
    fontWeight: "700",
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: sizes.m,
    gap: sizes.xs,
  },
  deleteText: {
    fontSize: font.s,
    color: colors.fail,
    fontWeight: "700",
  },
});
