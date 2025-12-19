import { ActivityIndicator, Text, View, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Channel as ChannelElement, MessageInput, MessageList, useChatContext } from "stream-chat-expo";
import ConsultationMessageFooter from "@/src/components/ConsultationMessageFooter";
import { useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import ConsultRequestChip from "@/src/components/ConsultRequestChip";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatHeader from "@/src/components/headers/ChatHeader";
import { colors, sizes } from "@/src/shared/designSystem";
import { useLocalSearchParams } from "expo-router";
import useAuthStore from "@/src/shared/authStore";
import utils from "@/src/shared/utils";
import uuid from "react-native-uuid";

export default function IndividualChatScreen() {
  const me = useAuthStore((state) => state.me);
  const { cid } = useLocalSearchParams();
  const { client } = useChatContext();
  const [channelType, channelID] = (cid as string)?.split(":") || [null, null];
  const streamVideoClient = useStreamVideoClient();

  if (!me || !client || !channelType || !channelID || !client.user?.id) {
    return (
      <View style={styles.loadingContainer}>
        {!me && <Text>{"'Me' is null"}</Text>}
        {!client && <Text>Client is invalid</Text>}
        {!channelType && <Text>ChannelType is invalid</Text>}
        {!channelID && <Text>ChannelID is invalid</Text>}
        {!client.user?.id && <Text>UserID is invalid</Text>}
        <ActivityIndicator />
      </View>
    );
  }

  const channel = client.channel(channelType, channelID);
  const otherMember = utils.getOtherMemberInChannel(channel, client.user.id.toString());
  if (otherMember === undefined) {
    return;
  }
  const otherFirstname = otherMember.name?.split(" ")[0] || "Missing name wthelly";

  const isDoctor = me.role === "VOLUNTEER_DOCTOR";

  // Only doctors can initiate calls (duh)
  const callPressHandler = isDoctor
    ? async (isVideo: boolean): Promise<void> => {
        if (!streamVideoClient?.state.connectedUser?.id || !otherMember.id) {
          return;
        }

        const call = streamVideoClient.call("default", uuid.v4(), { reuseInstance: false });
        await call.getOrCreate({
          ring: true,
          video: isVideo,
          data: {
            members: [{ user_id: streamVideoClient.state.connectedUser.id }, { user_id: otherMember.id }],
          },
        });
      }
    : undefined;

  const headerHeight = 50;
  const titlePrefix = isDoctor ? "" : "Dr. ";

  return (
    <SafeAreaView edges={["top", "left", "right"]}>
      <ChatHeader
        title={`${titlePrefix}${otherFirstname}`}
        showCallingIcons={isDoctor}
        onCallPress={callPressHandler}
        headerHeight={headerHeight}
      />

      <ChannelElement channel={channel} MessageFooter={isDoctor ? ConsultationMessageFooter : undefined}>
        <MessageList />

        <KeyboardAvoidingView keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}>
          <View style={[styles.inputWrapper, { marginBottom: headerHeight * 1.2 }]}>
            {/* Only mothers can request consultations */}
            {!isDoctor && <ConsultRequestChip channel={channel} />}
            <MessageInput
              additionalTextInputProps={{
                style: {
                  borderWidth: 0,
                  outlineWidth: 0,
                },
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </ChannelElement>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  inputWrapper: {
    paddingBottom: sizes.xxl,
    backgroundColor: colors.white,
  },
});
