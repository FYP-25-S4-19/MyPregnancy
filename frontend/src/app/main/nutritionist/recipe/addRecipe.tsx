import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { colors, sizes } from "@/src/shared/designSystem";
import { Dropdown } from "react-native-element-dropdown";
import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import api from "@/src/shared/api";
import {
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  Image,
  View,
  Text,
} from "react-native";

interface RecipeFormState {
  name: string;
  description: string;
  ingredients: string;
  instructions: string;
  estCalories: string;
  pregnancyBenefit: string;
  servingCount: number;
  trimester: number;
  categoryID: number;
}

interface CategoryOption {
  label: string;
  value: string;
}

export default function AddRecipeScreen() {
  const { draftId: draftIdParam, mode } = useLocalSearchParams();
  const draftId = draftIdParam ? Number(draftIdParam) : undefined;

  const [formState, setFormState] = useState<RecipeFormState>({
    name: "",
    description: "",
    ingredients: "",
    instructions: "",
    estCalories: "",
    pregnancyBenefit: "",
    servingCount: 1,
    trimester: 1,
    categoryID: 0,
  });

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [isCategoryFocus, setIsCategoryFocus] = useState(false);

  const trimesterData = [
    { label: "Trimester 1", value: "1" },
    { label: "Trimester 2", value: "2" },
    { label: "Trimester 3", value: "3" },
  ];

  /* ==================== HELPER FUNCTIONS ==================== */
  const updateFormState = <K extends keyof RecipeFormState>(key: K, value: RecipeFormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleNumericInput = (value: string): number => {
    const num = parseInt(value, 10);
    return isNaN(num) ? 0 : num;
  };

  /* ==================== FETCH CATEGORIES ==================== */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/recipes/categories");
        const categoryList: CategoryOption[] = res.data.map((cat: any) => ({
          label: cat.label,
          value: cat.id.toString(),
        }));
        setCategories(categoryList);
        if (categoryList.length > 0) {
          setFormState((prev) => ({ ...prev, categoryID: parseInt(categoryList[0].value, 10) }));
        }
      } catch (err) {
        console.log("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  /* ==================== FETCH DRAFT IF EDITING ==================== */
  useEffect(() => {
    if (draftId && mode === "edit") {
      const fetchDraft = async () => {
        try {
          setLoadingDraft(true);
          const res = await api.get(`/recipes/drafts/${draftId}`);
          const draft = res.data;
          setFormState({
            name: draft.name ?? "",
            description: draft.description ?? "",
            ingredients: draft.ingredients ?? "",
            instructions: draft.instructions_markdown ?? "",
            estCalories: draft.est_calories ?? "",
            pregnancyBenefit: draft.pregnancy_benefit ?? "",
            servingCount: draft.serving_count ?? 1,
            trimester: draft.trimester ?? 1,
            categoryID: draft.category_id ?? 0,
          });
          if (draft.img_url) {
            setImage({ uri: draft.img_url } as any);
          }
        } catch (err) {
          console.log("Failed to fetch draft", err);
        } finally {
          setLoadingDraft(false);
        }
      };
      fetchDraft();
    }
  }, [draftId, mode]);

  /* ==================== PICK IMAGE ==================== */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  /* ==================== SUBMIT DRAFT ==================== */
  const submitDraft = async (draftIdToUpdate?: number): Promise<number | null> => {
    try {
      const draftPayload = {
        name: formState.name || null,
        description: formState.description || null,
        ingredients: formState.ingredients || null,
        instructions_markdown: formState.instructions || null,
        est_calories: formState.estCalories || null,
        pregnancy_benefit: formState.pregnancyBenefit || null,
        serving_count: formState.servingCount || null,
        trimester: formState.trimester || null,
        category_id: formState.categoryID || null,
      };

      let createdDraftId: number | null = null;

      if (draftIdToUpdate) {
        // Update existing draft
        await api.patch(`/recipes/drafts/${draftIdToUpdate}`, draftPayload);
        createdDraftId = draftIdToUpdate;
      } else {
        // Create new draft
        const response = await api.post(`/recipes/drafts/`, draftPayload);
        createdDraftId = response.data.id;
      }

      // Upload image if selected and it's a new local file (not an existing S3 URL)
      if (image && image.uri && !image.uri.startsWith("http://") && !image.uri.startsWith("https://")) {
        const imageFormData = new FormData();
        imageFormData.append("img_file", {
          uri: image.uri,
          name: "recipe.jpg",
          type: "image/jpeg",
        } as any);

        await api.post(`/recipes/drafts/${createdDraftId}/image`, imageFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      return createdDraftId;
    } catch (err) {
      console.log("Error submitting draft", err);
      throw err;
    }
  };

  /* ==================== SUBMIT RECIPE ==================== */
  const submitRecipe = async (isDraft: boolean): Promise<void> => {
    if (!isDraft) {
      // Validation for publishing (not draft)
      if (!formState.name || !formState.description || !formState.ingredients || !formState.instructions) {
        Alert.alert("Missing info", "Please fill in all required fields to publish.");
        return;
      }

      if (!formState.estCalories) {
        Alert.alert("Missing info", "Please provide estimated calories to publish.");
        return;
      }

      if (!formState.pregnancyBenefit) {
        Alert.alert("Missing info", "Please provide pregnancy benefit information to publish.");
        return;
      }

      if (!formState.servingCount || formState.servingCount <= 0) {
        Alert.alert("Missing info", "Please provide a valid serving count to publish.");
        return;
      }

      if (!formState.categoryID || formState.categoryID === 0) {
        Alert.alert("Missing info", "Please select a category to publish.");
        return;
      }

      if (!formState.trimester || formState.trimester < 1 || formState.trimester > 3) {
        Alert.alert("Missing info", "Please select a valid trimester to publish.");
        return;
      }

      // Check if image exists (required for publishing)
      // This covers both new local images and existing S3 URLs from drafts
      if (!image || !image.uri || image.uri.length === 0) {
        Alert.alert("Missing image", "Please upload an image before publishing the recipe.");
        return;
      }
    }

    try {
      setLoading(true);

      if (isDraft) {
        // Handle draft submission
        await submitDraft(draftId);
        Alert.alert("Success", draftId ? "Draft updated successfully" : "Draft created successfully");
        router.replace("/main/nutritionist/recipe/drafts");
      } else {
        // Handle recipe publication or creation
        if (draftId && mode === "edit") {
          // Publishing an existing draft
          await api.post(`/recipes/drafts/${draftId}/publish`, null);
          Alert.alert("Success", "Draft published successfully");
          router.replace("/main/nutritionist/recipe/drafts");
        } else {
          // Creating a new recipe directly (not from draft)
          const formData = new FormData();
          formData.append("name", formState.name);
          formData.append("description", formState.description);
          formData.append("ingredients", formState.ingredients);
          formData.append("instructions", formState.instructions);
          formData.append("est_calories", formState.estCalories);
          formData.append("pregnancy_benefit", formState.pregnancyBenefit);
          formData.append("serving_count", formState.servingCount.toString());
          formData.append("trimester", formState.trimester.toString());
          formData.append("category_id", formState.categoryID.toString());
          if (image && image.uri) {
            formData.append("image_file", {
              uri: image.uri,
              name: "recipe.jpg",
              type: "image/jpeg",
            } as any);
          }

          // console.log("About to POST recipe data...", formData);
          await api.post(`/recipes/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          Alert.alert("Success", "Recipe created successfully");
          router.back();
        }
      }
    } catch (err) {
      console.log("Error submitting recipe", err);
      Alert.alert("Error", "Failed to save recipe");
    } finally {
      setLoading(false);
    }
  };

  if (loadingDraft) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{draftId ? "Edit Recipe Draft" : "Add New Recipe"}</Text>
        <View style={styles.card}>
          <Input
            label="Recipe Name"
            placeholder="*required"
            value={formState.name}
            onChangeText={(value) => updateFormState("name", value)}
          />
          <Input
            label="Description"
            placeholder="*required"
            value={formState.description}
            onChangeText={(value) => updateFormState("description", value)}
            multiline
          />
          <Input
            label="Ingredients"
            placeholder="*required"
            value={formState.ingredients}
            onChangeText={(value) => updateFormState("ingredients", value)}
            multiline
          />
          <Input
            label="Instructions"
            placeholder="*required"
            value={formState.instructions}
            onChangeText={(value) => updateFormState("instructions", value)}
            multiline
          />
          <Input
            label="Estimated Calories"
            placeholder="*required in kcal"
            value={formState.estCalories}
            onChangeText={(value) => updateFormState("estCalories", value)}
            keyboardType="numeric"
          />
          <Input
            label="Pregnancy Benefit"
            placeholder="*required"
            value={formState.pregnancyBenefit}
            onChangeText={(value) => updateFormState("pregnancyBenefit", value)}
          />

          {/* Trimester Dropdown */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Trimester</Text>
            <Dropdown
              style={[styles.input, isFocus && { borderColor: colors.primary }]}
              data={trimesterData}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isFocus ? "Select trimester" : "..."}
              value={formState.trimester.toString()}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={(item) => updateFormState("trimester", parseInt(item.value, 10))}
              renderRightIcon={() => <Ionicons name="chevron-down" size={20} color={colors.text} />}
            />
          </View>

          {/* Category Dropdown */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Category</Text>
            <Dropdown
              style={[styles.input, isCategoryFocus && { borderColor: colors.primary }]}
              data={categories}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isCategoryFocus ? "Select category" : "..."}
              value={formState.categoryID.toString()}
              onFocus={() => setIsCategoryFocus(true)}
              onBlur={() => setIsCategoryFocus(false)}
              onChange={(item) => updateFormState("categoryID", parseInt(item.value, 10))}
              renderRightIcon={() => <Ionicons name="chevron-down" size={20} color={colors.text} />}
            />
          </View>

          {/* Serving Count Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Serving Count</Text>
            <TextInput
              style={styles.input}
              placeholder="*required per serving"
              placeholderTextColor={colors.secondary}
              value={formState.servingCount.toString()}
              onChangeText={(value) => {
                const num = handleNumericInput(value);
                updateFormState("servingCount", num);
              }}
              keyboardType="number-pad"
              textAlignVertical="center"
            />
          </View>

          {/* Image Upload */}
          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.preview} />
            ) : (
              <>
                <Text style={styles.uploadIcon}>🖼️</Text>
                <Text style={styles.uploadText}>Choose Files to Upload</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.submitBtn} onPress={() => submitRecipe(false)} disabled={loading}>
              <Text style={styles.submitText}>
                {loading ? "Submitting..." : draftId ? "Publish Recipe" : "Create Recipe"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.draftBtn} onPress={() => submitRecipe(true)} disabled={loading}>
              <Text style={styles.draftText}>{loading ? "Saving..." : draftId ? "Update Draft" : "Save as Draft"}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: sizes.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ==================== REUSABLE INPUT COMPONENT ==================== */
interface InputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  keyboardType?: "numeric" | "number-pad" | "default";
}

function Input({ label, placeholder, value, onChangeText, multiline = false, keyboardType = "default" }: InputProps) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 100, textAlignVertical: "top" }]}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

/* ==================== STYLES ==================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.veryLightPink, paddingHorizontal: sizes.l },
  title: { fontSize: sizes.xl, marginVertical: sizes.l, textAlign: "center" },
  card: { backgroundColor: colors.white, borderRadius: sizes.l, padding: sizes.l },
  inputWrapper: { marginBottom: sizes.m },
  label: { marginBottom: sizes.xs, color: "#000" },
  input: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.m,
    fontSize: sizes.m,
    borderWidth: 2,
    borderColor: colors.inputFieldBackground,
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    borderWidth: 2,
    borderColor: colors.inputFieldBackground,
    overflow: "hidden",
  },
  picker: { height: 50 },
  preview: { width: "100%", height: 180, borderRadius: sizes.m, marginTop: sizes.m },
  submitBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: sizes.m,
    borderRadius: sizes.m,
    alignItems: "center",
    marginLeft: sizes.s,
  },
  draftBtn: {
    flex: 1,
    backgroundColor: colors.inputFieldBackground,
    paddingVertical: sizes.m,
    borderRadius: sizes.m,
    alignItems: "center",
    marginRight: sizes.s,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.secondary,
    borderRadius: sizes.m,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginTop: sizes.m,
  },
  uploadIcon: { fontSize: 28, marginBottom: sizes.xs },
  uploadText: { color: colors.primary },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: sizes.l },
  draftText: { color: colors.primary },
  submitText: { color: "white", fontSize: sizes.m },
});
