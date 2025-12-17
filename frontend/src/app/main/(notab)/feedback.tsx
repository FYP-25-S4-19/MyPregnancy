import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";

export default function FeedbackScreen() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a star rating before submitting.");
      return;
    }

    if (!feedback.trim()) {
      Alert.alert("Feedback Required", "Please describe your experience before submitting.");
      return;
    }

    // TODO: Submit feedback to backend
    console.log("Submitting feedback:", { rating, feedback });
    Alert.alert("Thank you!", "Your feedback has been submitted successfully.", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send us your feedback!</Text>
      </View>

      <View style={styles.content}>
        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.questionText}>How was your experience?</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                activeOpacity={0.7}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={48}
                  color={star <= rating ? "#FFD700" : colors.text}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback Text Input */}
        <TextInput
          style={styles.textInput}
          placeholder="Describe your experience here.."
          placeholderTextColor={colors.lightGray}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          value={feedback}
          onChangeText={setFeedback}
        />

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} activeOpacity={0.8}>
          <Text style={styles.submitButtonText}>Send feedback</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.l,
    backgroundColor: colors.veryLightPink,
    gap: sizes.s,
  },
  backButton: {
    padding: sizes.xs,
  },
  headerTitle: {
    fontSize: font.xl,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: sizes.l,
    borderTopRightRadius: sizes.l,
    paddingHorizontal: sizes.l,
    paddingTop: sizes.xl,
  },
  ratingSection: {
    marginBottom: sizes.xl,
  },
  questionText: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.black,
    marginBottom: sizes.m,
  },
  starsContainer: {
    flexDirection: "row",
    gap: sizes.xs,
    marginBottom: sizes.l,
  },
  starButton: {
    padding: sizes.xs,
  },
  textInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: sizes.m,
    padding: sizes.m,
    fontSize: font.s,
    color: colors.text,
    height: 200,
    marginBottom: sizes.xl,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  submitButton: {
    backgroundColor: colors.secondary,
    paddingVertical: sizes.m,
    paddingHorizontal: sizes.l,
    borderRadius: sizes.m,
    alignItems: "center",
    alignSelf: "center",
    ...shadows.small,
  },
  submitButtonText: {
    fontSize: font.s,
    fontWeight: "600",
    color: colors.text,
  },
});
