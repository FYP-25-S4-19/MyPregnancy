import {
  useProductCategories,
  useAddNewProductMutation,
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
import { router } from "expo-router";
import api from "@/src/shared/api";
import { useState } from "react";

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

const mimeTypeFromFilename = (filename: string): string => {
  const match = /\.(\w+)$/.exec(filename);
  const ext = match?.[1]?.toLowerCase();
  if (!ext) return "image/jpeg";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  if (ext === "heif") return "image/heif";
  return `image/${ext}`;
};

const normalizePrice = (value: unknown): string | null => {
  if (value == null) return null;
  const raw = String(value);
  const m = raw.replace(",", ".").match(/\d{1,6}(?:\.\d{1,2})?/);
  return m ? m[0] : null;
};

const inferObjectType = (labels?: string[], rawText?: string): string | null => {
  const hay = `${(labels || []).join(" ")} ${rawText || ""}`.toLowerCase();

  // Prioritize concrete nouns that are useful for merchants.
  const rules: Array<{ object: string; keywords: string[] }> = [
    { object: "stroller", keywords: ["stroller", "pram", "pushchair", "baby carriage"] },
    { object: "car seat", keywords: ["car seat", "infant seat", "booster seat"] },
    { object: "crib", keywords: ["crib", "cot", "bassinet"] },
    { object: "mattress", keywords: ["mattress"] },
    { object: "high chair", keywords: ["high chair"] },
    { object: "chair", keywords: ["chair", "armchair", "rocking chair", "seat", "stool"] },
    { object: "bottle", keywords: ["bottle", "baby bottle", "water bottle"] },
    { object: "pacifier", keywords: ["pacifier", "soother"] },
    { object: "breast pump", keywords: ["breast pump", "pump"] },
    { object: "diaper", keywords: ["diaper", "nappy"] },
    { object: "bib", keywords: ["bib"] },
    { object: "blanket", keywords: ["blanket", "swaddle"] },
    { object: "clothes", keywords: ["onesie", "romper", "cardigan", "socks", "hat", "clothing", "apparel"] },
    { object: "shoe", keywords: ["shoe", "sneaker", "boot", "footwear", "moccasin"] },
    { object: "toy", keywords: ["toy", "blocks", "flashcards", "board book", "play gym", "doll"] },
    { object: "night light", keywords: ["night light", "lamp"] },
    { object: "monitor", keywords: ["baby monitor", "monitor"] },
    { object: "thermometer", keywords: ["thermometer"] },
    { object: "towel", keywords: ["towel", "washcloth"] },
    { object: "bathtub", keywords: ["bathtub", "bath", "bath sling"] },
    { object: "detergent", keywords: ["detergent", "laundry"] },
    { object: "cream", keywords: ["cream", "ointment"] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((k) => hay.includes(k))) return rule.object;
  }
  return null;
};

const augmentProductName = (name: string, objectType: string | null): string => {
  const cleanName = (name || "").trim();
  if (!cleanName) return cleanName;
  if (!objectType) return cleanName;

  const loweredName = cleanName.toLowerCase();
  const loweredObject = objectType.toLowerCase();
  if (loweredName.includes(loweredObject)) return cleanName;

  return `${cleanName} ${objectType}`;
};

const inferCategoryValue = (
  options: Array<{ label: string; value: string }>,
  labels?: string[],
  rawText?: string,
  objectType?: string | null,
): string | null => {
  if (!options || options.length === 0) return null;

  const hay = `${(labels || []).join(" ")} ${rawText || ""} ${objectType || ""}`.toLowerCase();

  const has = (keywords: string[]) => keywords.some((k) => hay.includes(k));
  const pick = (categoryLabel: string): string | null => {
    const match = options.find((o) => o.value.toLowerCase() === categoryLabel.toLowerCase());
    return match?.value ?? null;
  };

  // Map keywords → your seeded categories:
  // Safety, Bath, Travel, Clothing, Toys, Feeding, Health, Nursery, Cleaning, Essentials, Maternity
  if (has(["maternity", "nursing", "postpartum", "support belt", "nursing pads"])) return pick("Maternity");
  if (has(["bottle", "pacifier", "breast pump", "formula", "spoon", "plate", "sterilizer", "feeding"]))
    return pick("Feeding") || pick("Essentials");
  if (has(["bath", "bathtub", "towel", "washcloth", "bath sling", "bath thermometer"])) return pick("Bath");
  if (has(["stroller", "car seat", "carrier", "travel", "backpack"])) return pick("Travel");
  if (has(["onesie", "romper", "cardigan", "socks", "hat", "clothing", "shoe", "footwear"])) return pick("Clothing");
  if (has(["toy", "blocks", "flashcards", "book", "play gym", "doll"])) return pick("Toys");
  if (has(["crib", "cot", "bassinet", "mattress", "monitor", "night light", "humidifier", "nursery"]))
    return pick("Nursery");
  if (has(["gate", "corner protector", "anchors", "safety", "lock"])) return pick("Safety");
  if (has(["detergent", "laundry", "cleaning", "sanitizing"])) return pick("Cleaning");
  if (has(["thermometer", "cream", "ointment", "aspirator", "nail trimmer", "health"])) return pick("Health");
  if (has(["diaper", "bib", "swaddle", "blanket", "essentials"])) return pick("Essentials");

  // Fallback: if any category label is explicitly present in OCR/labels, pick it.
  const direct = options.find((o) => hay.includes(o.value.toLowerCase()));
  return direct?.value ?? null;
};

const buildRichDescriptionFromScan = (scan: ScanResponse | null): string | null => {
  if (!scan) return null;
  const raw = (scan.raw_text || "").trim();
  const labels = (scan.labels || []).filter(Boolean);

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 2)
    .filter((l) => !/^((RM|\$)\s*)?\d{1,6}([.,]\d{2})?$/.test(l)); // remove standalone price lines

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const l of lines) {
    const key = l.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(l);
    if (unique.length >= 6) break;
  }

  const parts: string[] = [];
  if (unique.length) parts.push(unique.join("\n"));

  // Add a small tag line for context (no hallucination, just detected labels)
  const topLabels = labels.slice(0, 5);
  if (topLabels.length) parts.push(`Tags: ${topLabels.join(", ")}`);

  const result = parts.join("\n\n").trim();
  return result ? result.slice(0, 800) : null;
};

export default function AddProductScreen() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isFocus, setIsFocus] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [lastScannedUri, setLastScannedUri] = useState<string | null>(null);

  const { data: productCategories } = useProductCategories();
  const { mutate: addNewProduct, isPending } = useAddNewProductMutation();
  const { mutate: createProductDraftMutate, isPending: isDraftPending } = useCreateProductDraftMutation();

  const scanProductFromImage = async (uri: string) => {
    if (scanning) return;
    setScanning(true);
    try {
      const filename = uri.split("/").pop() || "image.jpg";
      const type = mimeTypeFromFilename(filename);

      const formData = new FormData();
      formData.append("img_file", {
        uri,
        name: filename,
        type,
      } as any);

      const res = await api.post<ScanResponse>("/products/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLastScannedUri(uri);
      setScanResult(res.data || null);

      const candidates = res.data?.candidates;
      const labels = res.data?.labels || [];
      const rawText = res.data?.raw_text || "";
      const objectType = inferObjectType(labels, rawText);

      // Auto-select category if merchant hasn't selected one yet.
      if (!category) {
        const options =
          productCategories?.map((c) => {
            return { label: c.label, value: c.label };
          }) || [];
        const inferred = inferCategoryValue(options, labels, rawText, objectType);
        if (inferred) setCategory(inferred);
      }

      if (!candidates) {
        Alert.alert("Scan Result", "Couldn’t extract product info. You can still fill it manually.");
        return;
      }

      // By default: only fill missing fields (avoid overwriting what merchant already typed)
      const nextName = candidates.name ? augmentProductName(String(candidates.name), objectType) : null;
      const nextPrice = normalizePrice(candidates.price);
      const nextDescCandidate = candidates.description ? String(candidates.description) : null;
      const nextDescFallback = buildRichDescriptionFromScan(res.data || null);
      const nextDesc =
        nextDescCandidate && nextDescCandidate.trim().length >= 20 ? nextDescCandidate : nextDescFallback;

      if (nextName && !productName.trim()) setProductName(nextName);
      if (nextPrice && !price.trim()) setPrice(nextPrice);
      if (nextDesc && !description.trim()) setDescription(nextDesc);

      if (!nextName && !nextPrice && !nextDesc) {
        Alert.alert("Scan Result", "Couldn’t extract product info. You can still fill it manually.");
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message;
      if (typeof detail === "string" && detail.includes("Vision scan disabled")) {
        Alert.alert(
          "Scan Unavailable",
          "Product scanning is disabled on the server (VISION_ENABLED=false). You can still add products manually.",
        );
      } else {
        Alert.alert("Scan Failed", detail || "Failed to scan the image.");
      }
    } finally {
      setScanning(false);
    }
  };

  const pickImage = async () => {
    const chooseFromLibrary = async () => {
      try {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (perm.status !== "granted") {
          Alert.alert("Permission needed", "Media library permission is required to choose a photo.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const uri = result.assets[0].uri;
          setImageUri(uri);
          setScanResult(null);
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
          setScanResult(null);
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

  const validateForm = (): boolean => {
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
    if (!imageUri) {
      Alert.alert("Validation Error", "Please upload a product image");
      return false;
    }
    return true;
  };

  const handleAddNewProduct = async (): Promise<void> => {
    if (!validateForm()) return;

    // Convert price to cents
    const priceCents = Math.round(Number(price) * 100);

    // Get filename and type from URI
    const filename = imageUri!.split("/").pop() || "image.jpg";
    const type = mimeTypeFromFilename(filename);

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

            {imageUri ? (
              <View style={{ marginTop: sizes.s, flexDirection: "row", justifyContent: "space-between", gap: sizes.s }}>
                <TouchableOpacity
                  style={[styles.button, styles.draftButton, { flex: 1, marginLeft: 0 }]}
                  disabled={isPending || scanning || lastScannedUri === imageUri}
                  onPress={() => scanProductFromImage(imageUri)}
                >
                  <Text style={styles.draftButtonText}>{lastScannedUri === imageUri ? "Scanned" : "Scan"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.addButton, { flex: 1, marginLeft: 0 }]}
                  disabled={isPending || scanning || !scanResult?.candidates}
                  onPress={() => {
                    const candidates = scanResult?.candidates;
                    if (!candidates) return;

                    const objectType = inferObjectType(scanResult?.labels, scanResult?.raw_text);
                    const nextName = candidates.name ? augmentProductName(String(candidates.name), objectType) : "";
                    const nextPrice = normalizePrice(candidates.price) || "";
                    const nextDesc = candidates.description ? String(candidates.description) : "";
                    const richDesc = buildRichDescriptionFromScan(scanResult);

                    if (nextName) setProductName(nextName);
                    if (nextPrice) setPrice(nextPrice);
                    if (nextDesc) setDescription(nextDesc);
                    else if (richDesc) setDescription(richDesc);

                    // Apply category as well (but only if we can infer one)
                    const options =
                      productCategories?.map((c) => {
                        return { label: c.label, value: c.label };
                      }) || [];
                    const inferredCategory = inferCategoryValue(
                      options,
                      scanResult?.labels,
                      scanResult?.raw_text,
                      objectType,
                    );
                    if (inferredCategory) setCategory(inferredCategory);

                    Alert.alert("Applied", "Scan results applied to the form.");
                  }}
                >
                  <Text style={styles.addButtonText}>Apply Scan</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {scanResult?.candidates ? (
              <View
                style={{
                  marginTop: sizes.s,
                  borderWidth: 1,
                  borderColor: colors.lightGray,
                  borderRadius: 12,
                  padding: sizes.s,
                  backgroundColor: colors.white,
                }}
              >
                <Text style={{ fontWeight: "700", color: colors.text, marginBottom: 6 }}>Scan Preview</Text>
                <Text style={{ color: colors.text, opacity: 0.8 }}>
                  Object: {inferObjectType(scanResult.labels, scanResult.raw_text) || "(not sure)"}
                </Text>
                <Text style={{ color: colors.text, opacity: 0.8 }}>
                  Name: {scanResult.candidates.name || "(not found)"}
                </Text>
                <Text style={{ color: colors.text, opacity: 0.8 }}>
                  Price: {normalizePrice(scanResult.candidates.price) || "(not found)"}{" "}
                  {scanResult.candidates.currency || ""}
                </Text>
                <Text style={{ color: colors.text, opacity: 0.8 }} numberOfLines={3}>
                  Description: {scanResult.candidates.description || "(not found)"}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={createProductDraftHandler}
              style={[styles.button, styles.draftButton]}
              disabled={isPending}
            >
              <Text style={styles.draftButtonText}>Draft</Text>
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
