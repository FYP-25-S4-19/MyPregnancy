import {
  useAddNewProductMutation,
  useProductCategories,
  useCreateProductDraftMutation,
} from "@/src/shared/hooks/useProducts";
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
import { Dropdown } from "react-native-element-dropdown";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { router } from "expo-router";
import api from "@/src/shared/api";

type ScanResponse = {
  candidates?: {
    name?: string | null;
    price?: string | null;
    currency?: string | null;
    description?: string | null;
  };
  raw_text?: string;
  labels?: string[];
};

export default function AddProductScreen() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const { data: productCategories } = useProductCategories();
  const { mutate: addNewProduct, isPending } = useAddNewProductMutation();
  const { mutate: createProductDraftMutate, isPending: isDraftPending } = useCreateProductDraftMutation();

  const scanProductFromImage = async (uri: string) => {
    setScanning(true);
    try {
      const filename = uri.split("/").pop() || "image.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const ext = match?.[1]?.toLowerCase();
      const type = ext ? `image/${ext}` : "image/jpeg";

      const formData = new FormData();
      formData.append(
        "img_file",
        {
          uri,
          name: filename,
          type,
        } as any,
      );

      const res = await api.post<ScanResponse>("/products/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const candidates = res.data?.candidates;
      if (!candidates) {
        Alert.alert("Scan Result", "Couldn’t extract product info. You can still fill it manually.");
        return;
      }

      if (candidates.name && !productName.trim()) setProductName(String(candidates.name));
      if (candidates.price) setPrice(String(candidates.price));
      if (candidates.description && !description.trim()) setDescription(String(candidates.description));

      if (!candidates.name && !candidates.price && !candidates.description) {
        Alert.alert("Scan Result", "Couldn’t extract product info. You can still fill it manually.");
      }
    } catch (err: any) {
      Alert.alert("Scan Failed", err?.response?.data?.detail || err?.message || "Failed to scan the image.");
    } finally {
      setScanning(false);
    }
  };

  const pickImage = async () => {
    const chooseFromLibrary = async () => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const uri = result.assets[0].uri;
          setImageUri(uri);
          await scanProductFromImage(uri);
        }
      } catch {
        Alert.alert("Error", "Failed to pick image");
      }
    };

    const takePhoto = async () => {
      try {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (perm.status !== "granted") {
          Alert.alert("Permission needed", "Camera permission is required to take a photo.");
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const uri = result.assets[0].uri;
          setImageUri(uri);
          await scanProductFromImage(uri);
        }
      } catch {
        Alert.alert("Error", "Failed to take photo");
      }
    };

    Alert.alert("Upload Photo", "Choose a method", [
      { text: "Camera", onPress: takePhoto },
      { text: "Library", onPress: chooseFromLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const validateForm = (requireImage: boolean = true): boolean => {
    if (!productName.trim()) {
      Alert.alert("Validation Error", "Please enter a product name");
      return false;
    }
    if (!category) {
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
    if (requireImage && !imageUri) {
      Alert.alert("Validation Error", "Please upload a product image");
      return false;
    }
    return true;
  };

  const createProductDraftHandler = (): void => {
    // For drafts, we don't require an image
    if (!productName.trim() && !category && !price.trim() && !description.trim()) {
      Alert.alert("Validation Error", "Please fill in at least one field");
      return;
    }

    const priceCents = price.trim() ? Math.round(Number(price) * 100) : null;

    createProductDraftMutate(
      {
        name: productName.trim() || null,
        category_id: category ? parseInt(category) : null,
        price_cents: priceCents,
        description: description.trim() || null,
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Product draft saved successfully!", [{ text: "OK", onPress: () => router.back() }]);
        },
        onError: (error: any) => {
          Alert.alert("Error", error.response?.data?.detail || "Failed to save product draft");
        },
      },
    );
  };

  const handleAddNewProduct = async (): Promise<void> => {
    if (!validateForm()) return;

    // Convert price to cents
    const priceCents = Math.round(Number(price) * 100);

    // Get filename and type from URI
    const filename = imageUri!.split("/").pop() || "image.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    // Create file object for upload
    const imageFile = {
      uri: imageUri!,
      name: filename,
      type,
    };

    addNewProduct(
      {
        name: productName,
        category: category!,
        price_cents: priceCents,
        description: description,
        img_file: imageFile as any,
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Product added successfully!", [{ text: "OK", onPress: () => router.back() }]);
        },
        onError: (error: any) => {
          Alert.alert("Error", error.response?.data?.detail || "Failed to add product");
        },
      },
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Add New Product</Text>

        <View style={styles.formContainer}>
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
            <TouchableOpacity style={styles.uploadContainer} onPress={pickImage} disabled={isPending || scanning}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <>
                  <Ionicons name="images-outline" size={40} color={colors.tabIcon} />
                  <Text style={styles.uploadText}>Choose Files to Upload</Text>
                </>
              )}

              {scanning ? (
                <View style={{ position: "absolute", bottom: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ActivityIndicator size="small" color={colors.text} />
                  <Text style={{ color: colors.text, fontWeight: "600" }}>Scanning…</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={createProductDraftHandler}
              style={[styles.button, styles.draftButton]}
              disabled={isDraftPending}
            >
              {isDraftPending ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Text style={styles.draftButtonText}>Create Product Draft</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddNewProduct}
              style={[styles.button, styles.addButton]}
              disabled={isPending || scanning}
            >
              {isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.addButtonText}>Add</Text>
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
  scrollViewContent: { padding: sizes.l },
  title: {
    fontSize: font.xl,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: sizes.xl,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius,
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
    borderRadius: 16, // Larger border radius
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
  addButton: { backgroundColor: colors.primary },
  addButtonText: { color: colors.white, fontWeight: "bold" },
  footerText: { textAlign: "center", marginTop: sizes.xl, fontSize: font.m, color: colors.text, fontWeight: "bold" },
});
