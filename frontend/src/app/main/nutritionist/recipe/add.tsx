import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { colors, sizes, font } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import api from "@/src/shared/api"; // axios instance
import axios from "axios"

export default function AddRecipeScreen() {
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

  /* ---------------- pick image ---------------- */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  /* ---------------- submit ---------------- */
  const submitRecipe = async () => {
    if (!name || !image) {
      Alert.alert("Missing info", "Please fill in everything including the image.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("ingredients", ingredients);
      formData.append("instructions", instructions);
      formData.append("est_calories", estCalories);
      formData.append("pregnancy_benefit", pregnancyBenefit);
      formData.append("serving_count", servingCount);

      formData.append("image_file", {
        uri: image.uri,
        name: "recipe.jpg",
        type: "image/jpeg",
      } as any);
      // console.log(formData);

      // const res = await api.get("/")
      // console.log(res.data)
      await api.post("/recipes/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Alert.alert("Success", "Recipe created successfully");
      router.back();
    } catch (err) {
      const error = err as any
      Alert.alert("Error", "Failed to create recipe");
      console.log("Status", error.response.status)
      console.log("Data", error.response.data)
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add New Recipe</Text>

        <Input
          label="Recipe Name"
          placeholder="*required"
          value={name}
          onChangeText={setName}
        />
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
          placeholder="*required"
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
        <Input
          label="Serving Count"
          placeholder="*required"
          value={servingCount}
          onChangeText={setServingCount}
          keyboardType="numeric"
        />

        {/* Image picker */}
        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Text style={styles.imageBtnText}>
            {image ? "Change Image" : "Pick Recipe Image"}
          </Text>
        </TouchableOpacity>

        {image && (
          <Image source={{ uri: image.uri }} style={styles.preview} />
        )}

        {/* Submit */}
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={submitRecipe}
          disabled={loading}
        >
          <Text style={styles.submitText}>
            {loading ? "Submitting..." : "Create Recipe"}
          </Text>
        </TouchableOpacity>

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
        style={[
          styles.input,
          props.multiline && { height: 100, textAlignVertical: "top" },
        ]}
        placeholderTextColor={colors.secondary}
        textAlignVertical={props.multiline ? "top" : "center"}
      />
    </View>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
    paddingHorizontal: sizes.l,
  },
  title: {
    fontSize: sizes.xl,
    marginVertical: sizes.l,
    textAlign: "center",
  },
  inputWrapper: {
    marginBottom: sizes.m,
  },
  label: {
    marginBottom: sizes.xs,
    color: "#000",
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.m,
    fontSize: sizes.m,
    color: "#000",
  },
  imageBtn: {
    backgroundColor: colors.inputFieldBackground,
    padding: sizes.m,
    borderRadius: sizes.m,
    alignItems: "center",
    marginTop: sizes.m,
  },
  imageBtnText: {
    color: colors.primary,
  },
  preview: {
    width: "100%",
    height: 180,
    borderRadius: sizes.m,
    marginTop: sizes.m,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: sizes.m,
    borderRadius: sizes.l,
    alignItems: "center",
    marginTop: sizes.l,
  },
  submitText: {
    color: "white",
    fontSize: sizes.m,
  },
});
