import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { colors, sizes } from "@/src/shared/designSystem";
import { Dropdown } from "react-native-element-dropdown";
import React, { useEffect, useState } from "react";
import useAuthStore from "@/src/shared/authStore";
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

export default function AddRecipeScreen() {
  const { draftId: draftIdParam, mode } = useLocalSearchParams();
  const draftId = draftIdParam ? Number(draftIdParam) : undefined;

  const token = useAuthStore((state) => state.accessToken);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [estCalories, setEstCalories] = useState("");
  const [pregnancyBenefit, setPregnancyBenefit] = useState("");
  const [servingCount, setServingCount] = useState("");
  const [trimester, setTrimester] = useState<string>("1");
  const [categoryID, setCategoryID] = useState<string>("");
  const [categories, setCategories] = useState<Array<{ label: string; value: string }>>([]);
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

  /* ---------------- fetch categories on mount ---------------- */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/recipes/categories");
        const categoryList = res.data.map((cat: any) => ({
          label: cat.label,
          value: cat.id.toString(),
        }));
        setCategories(categoryList);
        if (categoryList.length > 0) {
          setCategoryID(categoryList[0].value);
        }
      } catch (err) {
        console.log("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, []);

  /* ---------------- fetch draft if editing ---------------- */
  useEffect(() => {
    if (draftId && mode === "edit") {
      const fetchDraft = async () => {
        try {
          setLoadingDraft(true);
          const res = await api.get(`/recipes/drafts/${draftId}`);
          const draft = res.data;
          setName(draft.name ?? "");
          setDescription(draft.description ?? "");
          setIngredients(draft.ingredients ?? "");
          setInstructions(draft.instructions_markdown ?? "");
          setEstCalories(draft.est_calories ?? "");
          setPregnancyBenefit(draft.pregnancy_benefit ?? "");
          setServingCount(draft.serving_count?.toString() ?? "");
          setTrimester(draft.trimester?.toString() ?? "1");
          if (draft.img_key) {
            setImage({ uri: `${process.env.EXPO_PUBLIC_API_URL}/files/${draft.img_key}` } as any);
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

  /* ---------------- pick image ---------------- */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // for latest Expo, you might need MediaType instead
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  /* ---------------- submit draft (JSON body) ---------------- */
  const submitDraft = async (draftIdToUpdate?: number): Promise<number | null> => {
    try {
      const draftPayload = {
        name: name || null,
        description: description || null,
        ingredients: ingredients || null,
        instructions_markdown: instructions || null,
        est_calories: estCalories || null,
        pregnancy_benefit: pregnancyBenefit || null,
        serving_count: servingCount ? parseInt(servingCount) : null,
        trimester: trimester ? parseInt(trimester) : null,
        category_id: categoryID || null,
      };

      let createdDraftId: number | null = null;

      if (draftIdToUpdate) {
        // Update existing draft
        const updatePayload = {
          ...draftPayload,
          category: categoryID ? categoryID : null,
        };
        delete (updatePayload as any).category;

        await api.patch(`/recipes/drafts/${draftIdToUpdate}`, updatePayload);
        createdDraftId = draftIdToUpdate;
      } else {
        // Create new draft
        const response = await api.post(`/recipes/drafts/`, draftPayload);
        createdDraftId = response.data.id;
      }

      // Upload image if selected
      if (image && image.uri && !image.uri.startsWith(process.env.EXPO_PUBLIC_API_URL || "")) {
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

  /* ---------------- submit recipe (form data) ---------------- */
  const submitRecipe = async (isDraft: boolean): Promise<void> => {
    if (!isDraft) {
      if (!name || !description || !ingredients || !instructions) {
        Alert.alert("Missing info", "Please fill in all required fields to publish.");
        return;
      }
    }

    try {
      setLoading(true);

      if (isDraft) {
        // Handle draft submission
        await submitDraft(draftId);
        Alert.alert("Success", draftId ? "Draft updated successfully" : "Draft created successfully");
        router.back();
      } else {
        // Handle recipe publication or creation
        if (draftId && mode === "edit") {
          // Publishing an existing draft
          await api.post(`/recipes/drafts/${draftId}/publish`, null);
          Alert.alert("Success", "Draft published successfully");
          router.back();
        } else {
          // Creating a new recipe directly (not from draft)
          const formData = new FormData();
          formData.append("name", name);
          formData.append("description", description);
          formData.append("ingredients", ingredients);
          formData.append("instructions", instructions);
          formData.append("est_calories", estCalories);
          formData.append("pregnancy_benefit", pregnancyBenefit);
          formData.append("serving_count", servingCount);
          formData.append("trimester", trimester);
          formData.append("category_id", categoryID);
          if (image && image.uri && !image.uri.startsWith(process.env.EXPO_PUBLIC_API_URL || "")) {
            formData.append("image_file", {
              uri: image.uri,
              name: "recipe.jpg",
              type: "image/jpeg",
            } as any);
          }

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
          <Input label="Recipe Name" placeholder="*required" value={name} onChangeText={setName} />
          <Input
            label="Description"
            placeholder="*required"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Input
            label="Ingredients"
            placeholder="*required"
            value={ingredients}
            onChangeText={setIngredients}
            multiline
          />
          <Input
            label="Instructions"
            placeholder="*required"
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />
          <Input
            label="Estimated Calories"
            placeholder="*required in kcal"
            value={estCalories}
            onChangeText={setEstCalories}
            keyboardType="numeric"
          />
          <Input
            label="Pregnancy Benefit"
            placeholder="*required"
            value={pregnancyBenefit}
            onChangeText={setPregnancyBenefit}
          />
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Trimester</Text>
            <Dropdown
              style={[styles.input, isFocus && { borderColor: colors.primary }]}
              data={trimesterData}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isFocus ? "Select trimester" : "..."}
              value={trimester}
              onFocus={() => setIsFocus(true)}
              onBlur={() => setIsFocus(false)}
              onChange={(item) => setTrimester(item.value)}
              renderRightIcon={() => <Ionicons name="chevron-down" size={20} color={colors.text} />}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Category</Text>
            <Dropdown
              style={[styles.input, isCategoryFocus && { borderColor: colors.primary }]}
              data={categories}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder={!isCategoryFocus ? "Select category" : "..."}
              value={categoryID}
              onFocus={() => setIsCategoryFocus(true)}
              onBlur={() => setIsCategoryFocus(false)}
              onChange={(item) => setCategoryID(item.value)}
              renderRightIcon={() => <Ionicons name="chevron-down" size={20} color={colors.text} />}
            />
          </View>

          <Input
            label="Serving Count"
            placeholder="*required per serving"
            value={servingCount}
            onChangeText={setServingCount}
            keyboardType="numeric"
          />

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

/* ---------------- reusable input ---------------- */
function Input({ label, ...props }: any) {
  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        style={[styles.input, props.multiline && { height: 100, textAlignVertical: "top" }]}
        placeholderTextColor={colors.secondary}
        textAlignVertical={props.multiline ? "top" : "center"}
      />
    </View>
  );
}

/* ---------------- styles ---------------- */
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
