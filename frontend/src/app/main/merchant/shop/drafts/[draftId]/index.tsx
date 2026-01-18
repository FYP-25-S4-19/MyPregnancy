import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Dropdown } from "react-native-element-dropdown";
import api from "@/src/shared/api";
import {
  useProductCategories,
  useUpdateProductDraftMutation,
  useUploadProductDraftImageMutation,
  usePublishProductDraftMutation,
} from "@/src/shared/hooks/useProducts";

interface ProductDraft {
  id: number;
  name: string | null;
  category_id: number | null;
  category_label: string | null;
  price_cents: number | null;
  description: string | null;
  img_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function EditProductDraftScreen() {
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const [draftName, setDraftName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFocus, setIsFocus] = useState(false);

  const { data: productCategories } = useProductCategories();
  const updateDraftMutation = useUpdateProductDraftMutation();
  const uploadImageMutation = useUploadProductDraftImageMutation();
  const publishDraftMutation = usePublishProductDraftMutation();

  useEffect(() => {
    const fetchDraft = async () => {
      if (!draftId) {
        Alert.alert("Error", "Draft ID not provided");
        router.back();
        return;
      }

      try {
        const response = await api.get<ProductDraft>(`/products/drafts/${draftId}/`);
        const draft = response.data;
        setDraftName(draft.name || "");
        setCategoryId(draft.category_id ? draft.category_id.toString() : null);
        setPrice(draft.price_cents ? (draft.price_cents / 100).toFixed(2) : "");
        setDescription(draft.description || "");
        setExistingImageUrl(draft.img_url || null);
      } catch (error) {
        console.log("Failed to fetch draft", error);
        Alert.alert("Error", "Failed to load draft");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchDraft();
  }, [draftId]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleSaveDraft = async (): Promise<void> => {
    if (!draftId) return;

    if (!draftName.trim() && !categoryId && !price.trim() && !description.trim() && !imageUri && !existingImageUrl) {
      Alert.alert("Validation Error", "Please fill in at least one field");
      return;
    }

    setSaving(true);

    try {
      // Update draft metadata
      const priceCents = price.trim() ? Math.round(Number(price) * 100) : null;
      const draftIdNum = parseInt(draftId);

      await updateDraftMutation.mutateAsync({
        draftId: draftIdNum,
        name: draftName.trim() || null,
        category_id: categoryId ? parseInt(categoryId) : null,
        price_cents: priceCents,
        description: description.trim() || null,
      });

      // Upload image if new one is selected
      if (imageUri) {
        await uploadImageMutation.mutateAsync({
          draftId: draftIdNum,
          imageUri,
        });
      }

      Alert.alert("Success", "Draft saved successfully!", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error: any) {
      console.log("Failed to save draft", error);
      Alert.alert("Error", error.response?.data?.detail || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (): Promise<void> => {
    if (!draftId) return;

    if (!draftName.trim()) {
      Alert.alert("Validation Error", "Please enter a product name");
      return;
    }

    if (!categoryId) {
      Alert.alert("Validation Error", "Please select a category");
      return;
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert("Validation Error", "Please enter a valid price");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Validation Error", "Please enter a description");
      return;
    }

    if (!imageUri && !existingImageUrl) {
      Alert.alert("Validation Error", "Please upload a product image");
      return;
    }

    setSaving(true);

    try {
      const draftIdNum = parseInt(draftId);
      await publishDraftMutation.mutateAsync(draftIdNum);
      Alert.alert("Success", "Product published successfully!", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error: any) {
      console.log("Failed to publish draft", error);
      Alert.alert("Error", error.response?.data?.detail || "Failed to publish product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const displayImageUri = imageUri || existingImageUrl;

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIconButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Product Draft</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Product Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Name:</Text>
            <TextInput
              style={styles.inputContainer}
              placeholder="Enter product name"
              placeholderTextColor={colors.tabIcon}
              value={draftName}
              onChangeText={setDraftName}
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
                    value: c.id.toString(),
                  };
                }) || []
              }
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isFocus ? "Select category" : "..."}
              value={categoryId}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={(item) => {
                setCategoryId(item.value);
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

          {/* Photo Upload */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Photo:</Text>
            <TouchableOpacity style={styles.uploadContainer} onPress={pickImage}>
              {displayImageUri ? (
                <Image source={{ uri: displayImageUri }} style={styles.previewImage} />
              ) : (
                <>
                  <Ionicons name="images-outline" size={40} color={colors.tabIcon} />
                  <Text style={styles.uploadText}>Choose Files to Upload</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleSaveDraft} style={[styles.button, styles.draftButton]} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.draftButtonText}>Save Draft</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePublish} style={[styles.button, styles.publishButton]} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.publishButtonText}>Publish</Text>
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
  scrollViewContent: { paddingBottom: sizes.xl },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
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
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius,
    margin: sizes.l,
    padding: sizes.l,
    ...shadows.medium,
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
  uploadContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderStyle: "dashed",
  },
  uploadText: { color: colors.text, marginTop: sizes.s, fontWeight: "600" },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    resizeMode: "cover",
  },
  buttonRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: sizes.l },
  button: { paddingVertical: sizes.s, paddingHorizontal: sizes.xl, borderRadius: 12, marginLeft: sizes.m },
  draftButton: { backgroundColor: colors.secondary },
  draftButtonText: { color: colors.text, fontWeight: "bold" },
  publishButton: { backgroundColor: colors.primary },
  publishButtonText: { color: colors.white, fontWeight: "bold" },
  placeholderStyle: { fontSize: font.s, color: colors.tabIcon },
  selectedTextStyle: { fontSize: font.s, color: colors.text },
  inputSearchStyle: { height: 40, fontSize: font.s },
});
