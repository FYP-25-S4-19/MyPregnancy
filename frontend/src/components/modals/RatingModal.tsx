import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, sizes, font } from "../../shared/designSystem";

interface RatingModalProps {
  visible: boolean;
  doctorName: string;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  isSubmitting?: boolean;
}

export default function RatingModal({
  visible,
  doctorName,
  onClose,
  onSubmit,
  isSubmitting = false,
}: RatingModalProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const handleSubmit = () => {
    if (selectedRating > 0) {
      onSubmit(selectedRating);
    }
  };

  const handleClose = () => {
    setSelectedRating(0);
    setHoveredRating(0);
    onClose();
  };

  const displayRating = hoveredRating || selectedRating;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Rate Doctor</Text>
              <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                <Ionicons name="close" size={sizes.xl} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Doctor Name */}
            <Text style={styles.doctorName}>{doctorName}</Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>How would you rate your experience?</Text>

            {/* Star Rating */}
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setSelectedRating(star)}
                  onPressIn={() => setHoveredRating(star)}
                  onPressOut={() => setHoveredRating(0)}
                  disabled={isSubmitting}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={star <= displayRating ? "star" : "star-outline"}
                    size={48}
                    color={star <= displayRating ? colors.warning : colors.lightGray}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Rating Label */}
            {selectedRating > 0 && (
              <Text style={styles.ratingLabel}>
                {selectedRating === 1 && "Poor"}
                {selectedRating === 2 && "Fair"}
                {selectedRating === 3 && "Good"}
                {selectedRating === 4 && "Very Good"}
                {selectedRating === 5 && "Excellent"}
              </Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                selectedRating === 0 && styles.submitButtonDisabled,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={selectedRating === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Rating</Text>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius * 2,
    padding: sizes.xl,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: sizes.m,
  },
  title: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.primary,
  },
  doctorName: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.text,
    marginBottom: sizes.s,
  },
  subtitle: {
    fontSize: font.s,
    color: colors.tabIcon,
    marginBottom: sizes.xl,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: sizes.s,
    marginBottom: sizes.m,
  },
  starButton: {
    padding: sizes.xs,
  },
  ratingLabel: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.primary,
    textAlign: "center",
    marginBottom: sizes.l,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: sizes.m,
    borderRadius: sizes.borderRadius,
    alignItems: "center",
    marginBottom: sizes.m,
  },
  submitButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  submitButtonText: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.white,
  },
  cancelButton: {
    paddingVertical: sizes.m,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.tabIcon,
  },
});
