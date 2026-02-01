import { profileStyles } from "@/src/shared/globalStyles";
import { View, Text, TextInput } from "react-native";
import { colors } from "@/src/shared/designSystem";
import React, { FC, ReactNode } from "react";

export interface ProfileCardInputProps {
  inputLabel: string;
  fieldValue: string;
  onUpdateField: (value: string) => void;
  placeholder?: string;
}

export const ProfileCardInput: FC<ProfileCardInputProps> = ({ inputLabel, fieldValue, onUpdateField, placeholder }) => {
  return (
    <View style={profileStyles.inputGroup}>
      <Text style={profileStyles.inputLabel}>{inputLabel}</Text>
      <TextInput
        style={profileStyles.input}
        value={fieldValue}
        onChangeText={(text) => onUpdateField(text)}
        placeholder={placeholder ? placeholder : ""}
        placeholderTextColor={colors.lightGray}
      />
    </View>
  );
};

export interface ProfileCardReadOnlyInputProps {
  inputLabel: string;
  fieldValue: string;
}

export const ProfileCardReadOnlyInput: FC<ProfileCardReadOnlyInputProps> = ({ inputLabel, fieldValue }) => {
  return (
    <View style={profileStyles.inputGroup}>
      <Text style={profileStyles.inputLabel}>{inputLabel}</Text>
      <View style={[profileStyles.input, { backgroundColor: "#F5F5F5", justifyContent: "center" }]}>
        <Text style={{ color: colors.text, opacity: 0.7 }}>{fieldValue || "N/A"}</Text>
      </View>
    </View>
  );
};

interface ProfileCardContainerProps {
  children?: ReactNode;
}

const ProfileCardContainer: FC<ProfileCardContainerProps> = ({ children }) => {
  return (
    <View style={profileStyles.card}>
      <View style={profileStyles.formContainer}>{children}</View>
    </View>
  );
};

export default ProfileCardContainer;
