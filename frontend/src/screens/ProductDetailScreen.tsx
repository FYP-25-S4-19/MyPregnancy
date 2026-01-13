import { useProductDetail, useLikeProductMutation, useUnlikeProductMutation } from "@/src/shared/hooks/useProducts";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";

/**
 * Reusable Product Detail Screen Component
 *
 * This component displays product details in a consistent, parameterizable way that can be used
 * across different user types (merchants, pregnant women, etc).
 *
 * @example
 * // Merchant product detail page (no like button, custom back navigation)
 * <ProductDetailScreen
 *   productId={productId}
 *   onBackPress={() => router.back()}
 *   showLikeButton={false}
 * />
 *
 * @example
 * // Pregnant woman product detail page (with like button)
 * <ProductDetailScreen
 *   productId={productId}
 *   onBackPress={() => router.navigate("/main/mother/(home)")}
 *   showLikeButton={true}
 * />
 */

interface ProductDetailScreenProps {
  /** The product ID to fetch and display details for */
  productId: number;
  /** Callback function when the back button is pressed - allows custom navigation per user type */
  onBackPress: () => void;
  /** Whether to show the like/heart button (only for consumers like pregnant women) */
  showLikeButton: boolean;
}

export default function ProductDetailScreen({ productId, onBackPress, showLikeButton }: ProductDetailScreenProps) {
  const isFirstLoad = useRef(true);

  const { data: product, isLoading, error } = useProductDetail(productId);
  const { mutate: likeProduct, isPending: isLiking } = useLikeProductMutation();
  const { mutate: unlikeProduct, isPending: isUnliking } = useUnlikeProductMutation();

  // Track if this is the first product detail page in the navigation
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
    }
  }, []);

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
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
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
          <TouchableOpacity onPress={onBackPress} style={styles.backIconButton}>
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
          {/* Heart Icon - Only shown if showLikeButton is true */}
          {showLikeButton && (
            <TouchableOpacity style={styles.heartButton} onPress={handleToggleLike} disabled={isLiking || isUnliking}>
              <Ionicons
                name={product.is_liked ? "heart" : "heart-outline"}
                size={32}
                color={product.is_liked ? colors.primary : colors.primary}
              />
            </TouchableOpacity>
          )}

          {/* Category */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{product.category.label}</Text>
          </View>

          {/* Price */}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Price:</Text>
            <Text style={styles.priceValue}>${priceInDollars}</Text>
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
  },
});
