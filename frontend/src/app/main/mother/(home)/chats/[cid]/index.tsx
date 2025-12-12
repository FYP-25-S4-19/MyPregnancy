import { Channel as ChannelElement, MessageList, MessageInput, useChatContext } from "stream-chat-expo";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatStyles } from "@/src/shared/globalStyles";
import ChatHeader from "@/src/components/ChatHeader";
import { Channel as ChannelType } from "stream-chat";
import { useLocalSearchParams } from "expo-router";
import useAuthStore from "@/src/shared/authStore";
import React from "react";
import {
  KeyboardAvoidingView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  View,
  Text,
} from "react-native";
import utils from "@/src/shared/utils";
import api from "@/src/shared/api";

const ConsultRequestChip = ({ channel }: { channel: ChannelType }) => {
  const handlePress = async (): Promise<void> => {
    if (!channel) return;

    const myID = useAuthStore.getState().me?.id;
    if (myID === undefined) {
      return;
    }

    const doctor = utils.getOtherMemberFromChannel(channel, myID.toString());
    if (doctor === undefined) {
      return;
    }

    const firstName = doctor.name?.split(" ")[0] || "Missing name wthelly";
    try {
      const today = new Date();
      const startDatetime = new Date(today.setDate(today.getDate() + 7));
      const res = await api.post("/appointments/", {
        doctor_id: doctor.id,
        start_time: startDatetime.toISOString(),
      });

      await channel.sendMessage({
        text: `
              Request sent to Dr ${firstName}
              [${utils.formatConsultRequestDate(startDatetime)}]
              You'll be notified when they respond
            `,
        consultData: {
          appointmentID: res.data.appointment_id,
          status: "pending",
        },
      });
    } catch (err) {
      console.error("Error sending consultation request message: ", err);
    }
  };

  return (
    <TouchableOpacity style={styles.consultationChip} onPress={handlePress}>
      <Text style={styles.consultationText}>Request Consultation</Text>
    </TouchableOpacity>
  );
};

export default function IndividualChatScreen() {
  const me = useAuthStore((state) => state.me);
  const { cid } = useLocalSearchParams();
  const { client } = useChatContext();
  const [channelType, channelID] = (cid as string)?.split(":") || [null, null];

  if (!client || !channelType || !channelID) {
    return (
      <View style={styles.loadingContainer}>
        {!client ? (
          <Text style={{ color: colors.text }}>Chat not available</Text>
        ) : (
          <ActivityIndicator size="large" color={colors.primary} />
        )}
      </View>
    );
  }
  const channel: ChannelType = client.channel(channelType, channelID);

  if (!me?.id) {
    return;
  }
  const doctor = utils.getOtherMemberFromChannel(channel, me.id.toString());
  if (doctor === undefined) {
    return;
  }
  const doctorFirstName = doctor.name?.split(" ")[0] || "Missing name wthelly";

  return (
    <SafeAreaView edges={["top", "left", "right"]}>
      <ChatHeader title={`Dr ${doctorFirstName}`} />

      <ChannelElement channel={channel}>
        <MessageList />

        <KeyboardAvoidingView keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}>
          <View style={chatStyles.inputWrapper}>
            <ConsultRequestChip channel={channel} />
            <MessageInput />
          </View>
        </KeyboardAvoidingView>
      </ChannelElement>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  consultationChip: {
    backgroundColor: colors.secondary,
    alignSelf: "flex-start",
    paddingVertical: sizes.xs,
    paddingHorizontal: sizes.m,
    borderRadius: sizes.m,
    marginBottom: sizes.xs,
    marginLeft: sizes.xs,
  },
  consultationText: {
    color: colors.text,
    fontSize: font.xs,
    fontWeight: "600",
  },

  sendButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: sizes.s,
    ...shadows.small,
  },
});
