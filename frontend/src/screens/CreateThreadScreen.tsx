import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useCreateThread, useThreadCategories } from "@/src/shared/hooks/useThreads";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ThreadCategoryData } from "@/src/shared/typesAndInterfaces";

interface CreateThreadScreenProps {
  onBack?: () => void;
}

export default function CreateThreadScreen({ onBack }: CreateThreadScreenProps) {
  const { data: threadCategories, isLoading: categoriesLoading } = useThreadCategories();
  const createThreadMutation = useCreateThread();

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<ThreadCategoryData | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);

  const handleBack = (): void => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handlePost = (): void => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a title");
      return;
    }

    if (!content.trim()) {
      Alert.alert("Validation Error", "Please enter a description");
      return;
    }

    createThreadMutation.mutate(
      {
        title: title.trim(),
        content: content.trim(),
        category_id: selectedCategory?.id,
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Thread created successfully!", [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ]);
        },
        onError: (error) => {
          Alert.alert("Error", "Failed to create thread. Please try again.");
          console.error("Create thread error:", error);
        },
      }
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Thread</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.formContainer}>
            {/* Title Input */}
            <Text style={styles.label}>Add a title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Add a title"
              placeholderTextColor={colors.lightGray}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />

            {/* Content Input */}
            <TextInput
              style={styles.contentInput}
              placeholder="Write a description .."
              placeholderTextColor={colors.lightGray}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            {/* Category Dropdown */}
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              disabled={categoriesLoading}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedCategory?.label || "Choose here"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>

            {/* Category Dropdown Menu */}
            {showCategoryDropdown && !categoriesLoading && threadCategories && (
              <View style={styles.dropdownMenu}>
                {threadCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        selectedCategory?.id === category.id && styles.dropdownOptionTextActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Post Button */}
            <TouchableOpacity
              style={[styles.postButton, createThreadMutation.isPending && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={createThreadMutation.isPending}
            >
              {createThreadMutation.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingVertical: sizes.m,
  },
  formContainer: {
    paddingHorizontal: sizes.l,
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    marginHorizontal: sizes.m,
    paddingVertical: sizes.l,
    marginVertical: sizes.m,
  },
  label: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.text,
    marginBottom: sizes.s,
  },
  titleInput: {
    fontSize: font.m,
    color: colors.text,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingVertical: sizes.m,
    marginBottom: sizes.l,
  },
  contentInput: {
    fontSize: font.s,
    color: colors.text,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: sizes.s,
    padding: sizes.m,
    minHeight: 150,
    marginBottom: sizes.l,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: sizes.m,
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
    marginBottom: sizes.l,
    backgroundColor: "#fafafa",
  },
  dropdownButtonText: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.7,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: sizes.s,
    marginBottom: sizes.l,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  dropdownOption: {
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownOptionText: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.7,
  },
  dropdownOptionTextActive: {
    fontWeight: "600",
    color: colors.primary,
    opacity: 1,
  },
  postButton: {
    backgroundColor: colors.primary,
    borderRadius: sizes.m,
    paddingVertical: sizes.m,
    alignItems: "center",
    justifyContent: "center",
    marginTop: sizes.m,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.white,
  },
});
