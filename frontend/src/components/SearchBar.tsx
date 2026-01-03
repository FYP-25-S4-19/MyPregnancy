import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, sizes, font } from "../shared/designSystem";

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSearchPress?: ()=> void;
  onSubmitEditing?: () => void;
}

export default function SearchBar({
  placeholder = "Search a Doctor or a specialization...",
  value,
  onChangeText,
  onSearchPress,
  onSubmitEditing,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.tabIcon}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        onSubmitEditing={onSubmitEditing}
      />
      <TouchableOpacity 
        style={styles.iconContainer}
        onPress={onSearchPress ?? onSubmitEditing}
        disabled={!onSearchPress && !onSubmitEditing}
      >
        <Ionicons name="search" size={sizes.icon} color={colors.tabIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: sizes.xs,
    marginHorizontal: sizes.m,
  },
  input: {
    flex: 1,
    fontSize: font.s,
    color: colors.text,
  },
  iconContainer: {
    marginLeft: sizes.s,
  },
});
