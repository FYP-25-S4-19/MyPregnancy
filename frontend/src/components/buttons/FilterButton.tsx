import React from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, sizes, font } from "../shared/designSystem";

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export default function FilterButton({ label, isActive, onPress }: FilterButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, isActive && styles.buttonActive]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.buttonText, isActive && styles.buttonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: sizes.l,
    paddingVertical: sizes.s + 2,
    borderRadius: 25,
    backgroundColor: colors.secondary,
  },
  buttonActive: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontSize: font.s,
    fontWeight: 500,
    color: colors.text,
  },
  buttonTextActive: {
    color: colors.white,
  },
});
