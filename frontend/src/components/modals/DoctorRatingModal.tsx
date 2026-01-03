import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";

interface DoctorRatingModalProps {
  isShown: boolean;
  doctorName: string;
  onClose: () => void;
  onSubmit: (rating: number) => Promise<void>;
}

export default function DoctorRatingModal({ isShown, doctorName, onClose, onSubmit }: DoctorRatingModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarPress = (rating: number): void => {
    setRating(rating);
  };

  const handleSubmit = async (): Promise<void> => {
    if (rating === null) return;

    setIsSubmitting(true);
    try {
      await onSubmit(rating);
      setRating(null);
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (): void => {
    if (!isSubmitting) {
      setRating(null);
      onClose();
    }
  };

  return (
    <Modal visible={isShown} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.contentContainer}>
            {/* Title */}
            <Text style={styles.title}>Your Consultation Just Ended</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              How helpful was {doctorName}?{"\n"}Tap to rate.
            </Text>

            {/* Star Rating */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleStarPress(star)}
                  disabled={isSubmitting}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={rating !== null && star <= rating ? "star" : "star-outline"}
                    size={48}
                    color={rating !== null && star <= rating ? "#FFD700" : colors.text}
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              {rating !== null && (
                <TouchableOpacity
                  style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.text} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit</Text>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: sizes.l,
  },
  modalContainer: {
    backgroundColor: colors.veryLightPink,
    borderRadius: sizes.l,
    width: "100%",
    maxWidth: 400,
    ...shadows.medium,
  },
  contentContainer: {
    padding: sizes.xl,
    alignItems: "center",
  },
  title: {
    fontSize: font.xl,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: sizes.m,
  },
  subtitle: {
    fontSize: font.m,
    color: colors.text,
    textAlign: "center",
    marginBottom: sizes.xl,
    lineHeight: font.m * 1.5,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: sizes.xl,
    gap: sizes.s,
  },
  starIcon: {
    marginHorizontal: sizes.xs,
  },
  buttonsContainer: {
    width: "100%",
    alignItems: "center",
    gap: sizes.m,
  },
  submitButton: {
    backgroundColor: colors.white,
    paddingVertical: sizes.m,
    paddingHorizontal: sizes.xl,
    borderRadius: sizes.s,
    minWidth: 120,
    alignItems: "center",
    ...shadows.small,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: font.m,
    color: colors.text,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "transparent",
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.l,
    borderRadius: sizes.s,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: font.m,
    color: colors.text,
    fontWeight: "500",
  },
});
