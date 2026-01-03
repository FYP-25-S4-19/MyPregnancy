import { useLocalSearchParams, router } from "expo-router";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useProductDetail, useLikeProductMutation, useUnlikeProductMutation } from "@/src/shared/hooks/useProducts";

export default function ProductDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id || "0");

  const { data: product, isLoading, error } = useProductDetail(productId);
  const { mutate: likeProduct, isPending: isLiking } = useLikeProductMutation();
  const { mutate: unlikeProduct, isPending: isUnliking } = useUnlikeProductMutation();

  const handleToggleLike = (): void => {
    if (!product) return;

    if (product.is_liked) {
      unlikeProduct(productId);
    } else {
      likeProduct(productId);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load product details</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const priceInDollars = (product.price_cents / 100).toFixed(2);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIconButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{product.name}</Text>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.img_url ? (
            <Image source={{ uri: product.img_url }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Ionicons name="image-outline" size={60} color={colors.tabIcon} />
            </View>
          )}
        </View>

        {/* Product Details Card */}
        <View style={styles.detailsCard}>
          {/* Heart Icon */}
          <TouchableOpacity style={styles.heartButton} onPress={handleToggleLike} disabled={isLiking || isUnliking}>
            <Ionicons
              name={product.is_liked ? "heart" : "heart-outline"}
              size={32}
              color={product.is_liked ? colors.primary : colors.primary}
            />
          </TouchableOpacity>

          {/* Category */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{product.category.label}</Text>
          </View>

          {/* Price */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.priceValue}>$ ${priceInDollars}</Text>
          </View>

          {/* Description */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Description:</Text>
            <Text style={styles.descriptionValue}>{product.description}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: sizes.xl,
  },
  errorText: {
    fontSize: font.l,
    color: colors.text,
    textAlign: "center",
    marginBottom: sizes.l,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: sizes.m,
    paddingHorizontal: sizes.xl,
    borderRadius: sizes.borderRadius,
  },
  backButtonText: {
    color: colors.white,
    fontSize: font.m,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
    backgroundColor: colors.veryLightPink,
  },
  backIconButton: {
    padding: sizes.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: font.l,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: sizes.s,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: colors.white,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.inputFieldBackground,
  },
  detailsCard: {
    backgroundColor: colors.white,
    marginTop: sizes.l,
    marginHorizontal: sizes.l,
    borderRadius: sizes.borderRadius * 2,
    padding: sizes.xl,
    ...shadows.medium,
    position: "relative",
  },
  heartButton: {
    position: "absolute",
    top: sizes.l,
    right: sizes.l,
    zIndex: 10,
    padding: sizes.xs,
  },
  detailSection: {
    marginBottom: sizes.l,
  },
  detailLabel: {
    fontSize: font.m,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.xs,
  },
  detailValue: {
    fontSize: font.s,
    color: colors.text,
  },
  priceValue: {
    fontSize: font.s,
    color: colors.text,
  },
  descriptionValue: {
    fontSize: font.s,
    color: colors.text,
    lineHeight: font.l,
    // borderTopWidth: 1,
    // borderTopColor: colors.lightGray,
    // borderStyle: "dashed",
    // paddingTop: sizes.m,
  },
});
