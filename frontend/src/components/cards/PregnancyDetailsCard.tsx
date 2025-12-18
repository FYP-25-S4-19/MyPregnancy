import { profileStyles } from "@/src/shared/globalStyles";
import { ProfileCardInput } from "./ProfileCardBase";
import { View, Text } from "react-native";
import React from "react";

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
        <ProfileCardInput inputLabel="Current week" fieldValue="" onUpdateField={() => {}} />
        <ProfileCardInput inputLabel="EDD (Due Date)" fieldValue="" onUpdateField={() => {}} />
      </View>
    </View>
  );
}
