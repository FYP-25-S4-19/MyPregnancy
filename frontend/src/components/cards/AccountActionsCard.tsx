import { View, Text, TouchableOpacity } from "react-native";
import { profileStyles } from "@/src/shared/globalStyles";
import { colors } from "@/src/shared/designSystem";

interface AccountActionsCardProps {
  onSendFeedback?: () => void;
  onLogOut: () => void;
  onDeleteAccount?: () => void;
}

export default function AccountActionsCard({ onSendFeedback, onLogOut, onDeleteAccount }: AccountActionsCardProps) {
  return (
    <View style={profileStyles.card}>
      <View>
        {onSendFeedback && (
          <TouchableOpacity style={profileStyles.actionButton} onPress={onSendFeedback}>
            <Text style={[profileStyles.actionButtonText, { color: colors.black, opacity: 0.4 }]}>Send Feedback</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={profileStyles.actionButton} onPress={onLogOut}>
          <Text style={[profileStyles.actionButtonText, { color: colors.fail }]}>Log Out</Text>
        </TouchableOpacity>

        {onDeleteAccount && (
          <TouchableOpacity style={profileStyles.actionButton} onPress={onDeleteAccount}>
            <Text style={[profileStyles.actionButtonText, { color: colors.fail }]}>Delete Account</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
