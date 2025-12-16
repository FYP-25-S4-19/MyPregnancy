import React from "react";
import { View, Text, TextInput } from "react-native";
import { colors } from "@/src/shared/designSystem";
import { profileStyles } from "@/src/shared/globalStyles";

interface PregnancyDetailsData {
  currentWeek: string;
  dueDate: string;
}

interface PregnancyDetailsCardProps {
  data: PregnancyDetailsData;
  onUpdateField?: (field: string, value: string) => void;
}

export default function PregnancyDetailsCard({ data, onUpdateField }: PregnancyDetailsCardProps) {
  return (
    <View style={profileStyles.card}>
      <Text style={profileStyles.cardTitle}>Pregnancy Details</Text>

      <View style={profileStyles.formContainer}>
        <View style={profileStyles.inputGroup}>
          <Text style={profileStyles.inputLabel}>Current Week</Text>
          <TextInput
            style={profileStyles.input}
            value={data.currentWeek}
            onChangeText={(text) => onUpdateField?.("currentWeek", text)}
            placeholder="Current Week"
            placeholderTextColor={colors.lightGray}
            keyboardType="numeric"
          />
        </View>

        <View style={profileStyles.inputGroup}>
          <Text style={profileStyles.inputLabel}>EDD (Due Date)</Text>
          <TextInput
            style={profileStyles.input}
            value={data.dueDate}
            onChangeText={(text) => onUpdateField?.("dueDate", text)}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.lightGray}
          />
        </View>
      </View>
    </View>
  );
}
