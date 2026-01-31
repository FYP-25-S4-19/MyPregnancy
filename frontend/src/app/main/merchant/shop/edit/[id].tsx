import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dropdown } from "react-native-element-dropdown";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import api from "@/src/shared/api";
import { useProductCategories, useUpdateProductMutation } from "@/src/shared/hooks/useProducts";

type ProductDetailed = {
  id: number;
  name: string;
  merchant_id: string;
  merchant_name: string;
  category: {
    id: number;
    label: string;
  };
  price_cents: number;
  description: string;
  img_url: string | null;
  is_liked: boolean;
};

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id || "0");

  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data: productCategories } = useProductCategories();
  const updateProductMutation = useUpdateProductMutation();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await api.get<ProductDetailed>(`/products/${productId}`);
        const product = res.data;

        setProductName(product.name);
        setCategory(product.category.label);
        setCategoryId(product.category.id);
        setPrice((product.price_cents / 100).toFixed(2));
        setDescription(product.description);
        setImageUrl(product.img_url);
      } catch (err) {
        console.log("Failed to fetch product", err);
        Alert.alert("Error", "Failed to load product details", [{ text: "OK", onPress: () => router.back() }]);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const validateForm = (): boolean => {
    if (!productName.trim()) {
      Alert.alert("Validation Error", "Please enter a product name");
      return false;
    }
    if (!categoryId) {
      Alert.alert("Validation Error", "Please select a category");
      return false;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert("Validation Error", "Please enter a valid price");
      return false;
    }
    if (!description.trim()) {
      Alert.alert("Validation Error", "Please enter a description");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const priceCents = Math.round(Number(price) * 100);

    updateProductMutation.mutate(
      {
        productId,
        name: productName,
        category_id: categoryId!,
        price_cents: priceCents,
        description: description,
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Product updated successfully!", [{ text: "OK", onPress: () => router.back() }]);
        },
        onError: (err: any) => {
          console.log("Failed to update product", err);
          Alert.alert("Error", err.response?.data?.detail || "Failed to update product");
        },
      },
    );
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Product</Text>

        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.formContainer}>
          {/* Product Image Preview */}
          {imageUrl && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUrl }} style={styles.previewImage} />
              <Text style={styles.imageNote}>Image cannot be changed after creation</Text>
            </View>
          )}

          {/* Product Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Name:</Text>
            <TextInput
              style={styles.inputContainer}
              placeholder="Enter product name"
              placeholderTextColor={colors.tabIcon}
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          {/* Category Dropdown */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category:</Text>
            <Dropdown
              style={[styles.inputContainer, isFocus && { borderColor: colors.primary }]}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              data={
                productCategories?.map((c) => {
                  return {
                    id: c.id,
                    label: c.label,
                    value: c.label,
                  };
                }) || []
              }
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isFocus ? "Select category" : "..."}
              value={category}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={(item) => {
                setCategory(item.value);
                setCategoryId(item.id);
                setIsFocus(false);
              }}
              renderRightIcon={() => <Ionicons name="chevron-down" size={20} color={colors.text} />}
            />
          </View>

          {/* Price */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Price:</Text>
            <View style={[styles.inputContainer, styles.priceRow]}>
              <Text style={styles.priceCurrency}>$</Text>
              <TextInput
                style={{ flex: 1, color: colors.text }}
                placeholder="0.00"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description:</Text>
            <TextInput
              style={[styles.inputContainer, styles.textArea]}
              placeholder="Enter product description"
              multiline
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.button, styles.cancelButton]}
              disabled={updateProductMutation.isPending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.button, styles.saveButton]}
              disabled={updateProductMutation.isPending}
            >
              {updateProductMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.veryLightPink },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
    backgroundColor: colors.veryLightPink,
  },
  backBtn: {
    width: 40,
  },
  headerTitle: {
    fontSize: font.l,
    fontWeight: "900",
    color: colors.primary,
  },
  scrollViewContent: { padding: sizes.l },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius,
    padding: sizes.l,
    ...shadows.medium,
  },
  imagePreviewContainer: {
    marginBottom: sizes.l,
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: sizes.borderRadius,
    marginBottom: sizes.xs,
  },
  imageNote: {
    fontSize: font.xs,
    color: colors.tabIcon,
    fontStyle: "italic",
  },
  formGroup: { marginBottom: sizes.m },
  label: {
    fontSize: font.s,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.xs,
  },
  inputContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: sizes.m,
    height: 45,
    justifyContent: "center",
  },
  priceRow: { flexDirection: "row", alignItems: "center" },
  priceCurrency: { marginRight: sizes.xs, fontWeight: "bold", color: colors.text },
  textArea: { height: 100, paddingTop: sizes.s },
  placeholderStyle: { fontSize: font.s, color: colors.tabIcon },
  selectedTextStyle: { fontSize: font.s, color: colors.text },
  inputSearchStyle: { height: 40, fontSize: font.s },
  buttonRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: sizes.l, gap: sizes.m },
  button: { paddingVertical: sizes.s, paddingHorizontal: sizes.xl, borderRadius: 12 },
  cancelButton: { backgroundColor: colors.secondary },
  cancelButtonText: { color: colors.text, fontWeight: "bold" },
  saveButton: { backgroundColor: colors.primary },
  saveButtonText: { color: colors.white, fontWeight: "bold" },
});
