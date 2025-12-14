import { ActivityIndicator, Text, View, KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Channel as ChannelElement, MessageInput, MessageList, useChatContext } from "stream-chat-expo";
import ConsultationMessageFooter from "@/src/components/ConsultationMessageFooter";
import { useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, sizes } from "@/src/shared/designSystem";
import ChatHeader from "@/src/components/ChatHeader";
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
      <View>
        {!me && <Text>{"'Me' is null"} is null</Text>}
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

  const callPressHandler = async (isVideo: boolean): Promise<void> => {
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
  };

  const headerHeight = 50;
  return (
    <SafeAreaView edges={["top", "left", "right"]}>
      {me.role === "VOLUNTEER_DOCTOR" ? (
        <ChatHeader
          title={`${otherFirstname}`}
          showCallingIcons
          onCallPress={callPressHandler}
          headerHeight={headerHeight}
        />
      ) : (
        <ChatHeader title={`${otherFirstname}`} headerHeight={headerHeight} />
      )}

      <ChannelElement
        channel={channel}
        MessageFooter={me.role === "VOLUNTEER_DOCTOR" ? ConsultationMessageFooter : undefined}
      >
        <MessageList />

        <KeyboardAvoidingView keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}>
          <View style={[styles.inputWrapper, { marginBottom: headerHeight * 2 }]}>
            <MessageInput
              additionalTextInputProps={{
                style: {
                  borderWidth: 0,
                  outlineWidth: 0,
                },
                placeholder: "Le custom placeholder",
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </ChannelElement>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  inputWrapper: {
    // paddingHorizontal: sizes.m,
    paddingBottom: sizes.xxl,
    backgroundColor: colors.background,
    // backgroundColor: "#FF0000",
  },
});
