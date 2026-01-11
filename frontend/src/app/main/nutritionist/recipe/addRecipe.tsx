import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";

import { colors, sizes } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import api from "@/src/shared/api";

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
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);

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

  /* ---------------- submit ---------------- */
  const submitRecipe = async (isDraft: boolean) => {
    if (!name || !description || !ingredients || !instructions) {
      Alert.alert("Missing info", "Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("ingredients", ingredients);
      formData.append("instructions_markdown", instructions);
      formData.append("est_calories", estCalories);
      formData.append("pregnancy_benefit", pregnancyBenefit);
      formData.append("serving_count", servingCount);
      if (image) {
        formData.append("image_file", {
          uri: image.uri,
          name: "recipe.jpg",
          type: "image/jpeg",
        } as any);
      }

      if (draftId && mode === "edit") {
        // Editing an existing draft
        if (isDraft) {
          await api.patch(`/recipes/drafts/${draftId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          Alert.alert("Success", "Draft updated successfully");
        } else {
          // Publishing the draft
          await api.post(`/recipes/drafts/${draftId}/publish`, null, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          Alert.alert("Success", "Draft published successfully");
        }
      } else {
        // Creating new
        if (isDraft) {
          await api.post(`/recipes/drafts`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          Alert.alert("Success", "Draft created successfully");
        } else {
          await api.post(`/recipes/`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          Alert.alert("Success", "Recipe created successfully");
        }
      }

      router.back();
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
          <Input label="Description" placeholder="*required" value={description} onChangeText={setDescription} multiline />
          <Input label="Ingredients" placeholder="*required" value={ingredients} onChangeText={setIngredients} multiline />
          <Input label="Instructions" placeholder="*required" value={instructions} onChangeText={setInstructions} multiline />
          <Input label="Estimated Calories" placeholder="*required in kcal" value={estCalories} onChangeText={setEstCalories} keyboardType="numeric" />
          <Input label="Pregnancy Benefit" placeholder="*required" value={pregnancyBenefit} onChangeText={setPregnancyBenefit} />
          <Input label="Serving Count" placeholder="*required per serving" value={servingCount} onChangeText={setServingCount} keyboardType="numeric" />

          <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
            {image ? <Image source={{ uri: image.uri }} style={styles.preview} /> : (
              <>
                <Text style={styles.uploadIcon}>🖼️</Text>
                <Text style={styles.uploadText}>Choose Files to Upload</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.submitBtn} onPress={() => submitRecipe(false)} disabled={loading}>
              <Text style={styles.submitText}>{loading ? "Submitting..." : draftId ? "Publish Recipe" : "Create Recipe"}</Text>
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
      <TextInput {...props} style={[styles.input, props.multiline && { height: 100, textAlignVertical: "top" }]} placeholderTextColor={colors.secondary} textAlignVertical={props.multiline ? "top" : "center"} />
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
  input: { backgroundColor: colors.white, borderRadius: sizes.m, padding: sizes.m, fontSize: sizes.m, borderWidth: 2, borderColor: colors.inputFieldBackground },
  preview: { width: "100%", height: 180, borderRadius: sizes.m, marginTop: sizes.m },
  submitBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: sizes.m, borderRadius: sizes.m, alignItems: "center", marginLeft: sizes.s },
  draftBtn: { flex: 1, backgroundColor: colors.inputFieldBackground, paddingVertical: sizes.m, borderRadius: sizes.m, alignItems: "center", marginRight: sizes.s },
  uploadBox: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.secondary, borderRadius: sizes.m, height: 160, justifyContent: "center", alignItems: "center", marginTop: sizes.m },
  uploadIcon: { fontSize: 28, marginBottom: sizes.xs },
  uploadText: { color: colors.primary },
  buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: sizes.l },
  draftText: { color: colors.primary },
  submitText: { color: "white", fontSize: sizes.m },
});
