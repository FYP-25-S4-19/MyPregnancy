import { profileStyles } from "@/src/shared/globalStyles";
import { Text, View } from "react-native";
import { ProfileCardInput } from "./ProfileCardBase";

interface PregnancyDetailsData {
  currentWeek: string;
  dueDate: string;
}

interface PregnancyDetailsCardProps {
  data: PregnancyDetailsData;
  onUpdateField: (field: keyof PregnancyDetailsData, value: string) => void;
}

export default function PregnancyDetailsCard({ data, onUpdateField }: PregnancyDetailsCardProps) {
  return (
    <View style={profileStyles.card}>
      <Text style={profileStyles.cardTitle}>Pregnancy Details</Text>

      <View style={profileStyles.formContainer}>
        <ProfileCardInput
          inputLabel="Current week"
          placeholder="e.g. 24"
          fieldValue={data.currentWeek}
          onUpdateField={(v) => onUpdateField("currentWeek", v)}
        />

        <ProfileCardInput
          inputLabel="EDD (Due Date)"
          placeholder="YYYY-MM-DD"
          fieldValue={data.dueDate}
          onUpdateField={(v) => onUpdateField("dueDate", v)}
        />
      </View>
    </View>
  );
}