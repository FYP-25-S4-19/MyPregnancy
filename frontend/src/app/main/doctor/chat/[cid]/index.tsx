import { Channel as ChannelElement, MessageInput, MessageList, useChatContext } from "stream-chat-expo";
import { ActivityIndicator, Text, View, KeyboardAvoidingView, Platform } from "react-native";
import ConsultationMessageFooter from "@/src/components/ConsultationMessageFooter";
import { useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatHeader from "@/src/components/headers/ChatHeader";
import { chatStyles } from "@/src/shared/globalStyles";
import { useLocalSearchParams } from "expo-router";
import utils from "@/src/shared/utils";
import uuid from "react-native-uuid";

export default function IndividualChatScreen() {
  const { cid } = useLocalSearchParams();
  const { client } = useChatContext();
  const [channelType, channelID] = (cid as string)?.split(":") || [null, null];
  const streamVideoClient = useStreamVideoClient();

  if (!client || !channelType || !channelID || !client.user?.id) {
    return (
      <View>
        {!client && <Text>Client is invalid</Text>}
        {!channelType && <Text>ChannelType is invalid</Text>}
        {!channelID && <Text>ChannelID is invalid</Text>}
        {!client.user?.id && <Text>UserID is invalid</Text>}
        <ActivityIndicator />
      </View>
    );
  }

  const channel = client.channel(channelType, channelID);
  const mother = utils.getOtherMemberInChannel(channel, client.user.id.toString());
  if (mother === undefined) {
    return;
  }
  const motherFirstName = mother.name?.split(" ")[0] || "Missing name wthelly";

  const callPressHandler = async (isVideo: boolean): Promise<void> => {
    if (!streamVideoClient?.state.connectedUser?.id || !mother.id) {
      return;
    }

    const call = streamVideoClient.call("default", uuid.v4(), {
      reuseInstance: false,
    });
    await call.getOrCreate({
      ring: true,
      video: isVideo,
      data: {
        members: [{ user_id: streamVideoClient.state.connectedUser.id }, { user_id: mother.id }],
      },
    });
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]}>
      <ChatHeader title={`${motherFirstName}`} showCallingIcons onCallPress={callPressHandler} />
      <ChannelElement channel={channel} MessageFooter={ConsultationMessageFooter}>
        <MessageList />

        <KeyboardAvoidingView keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}>
          <View style={chatStyles.inputWrapper}>
            <MessageInput />
          </View>
        </KeyboardAvoidingView>
      </ChannelElement>
    </SafeAreaView>
  );
}
