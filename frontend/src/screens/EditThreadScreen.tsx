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
import { useThread, useUpdateThread, useThreadCategories } from "@/src/shared/hooks/useThreads";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ThreadCategoryData } from "@/src/shared/typesAndInterfaces";

interface EditThreadScreenProps {
  onBack?: () => void;
}

export default function EditThreadScreen({ onBack }: EditThreadScreenProps) {
  const { tid } = useLocalSearchParams();
  const threadId = parseInt(typeof tid === "string" ? tid : Array.isArray(tid) ? tid[0] : "0", 10);

  const { data: thread, isLoading: threadLoading } = useThread(threadId);
  const { data: threadCategories, isLoading: categoriesLoading } = useThreadCategories();
  const updateThreadMutation = useUpdateThread();

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<ThreadCategoryData | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);

  // Load thread data into form when thread is fetched
  useEffect(() => {
    if (thread) {
      setTitle(thread.title);
      setContent(thread.content);
      if (thread.category) {
        setSelectedCategory(thread.category);
      }
    }
  }, [thread]);

  const handleBack = (): void => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleSave = (): void => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a title");
      return;
    }

    if (!content.trim()) {
      Alert.alert("Validation Error", "Please enter a description");
      return;
    }

    updateThreadMutation.mutate(
      {
        threadId,
        threadData: {
          title: title.trim(),
          content: content.trim(),
          category_id: selectedCategory?.id,
        },
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Thread updated successfully!", [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ]);
        },
        onError: (error) => {
          Alert.alert("Error", "Failed to update thread. Please try again.");
          console.error("Update thread error:", error);
        },
      },
    );
  };

  if (threadLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Thread</Text>
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
              <Text style={styles.dropdownButtonText}>{selectedCategory?.label || "Choose here"}</Text>
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

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, updateThreadMutation.isPending && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={updateThreadMutation.isPending}
            >
              {updateThreadMutation.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
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
  loadingContainer: {
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: sizes.m,
    paddingVertical: sizes.m,
    alignItems: "center",
    justifyContent: "center",
    marginTop: sizes.m,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.white,
  },
});
