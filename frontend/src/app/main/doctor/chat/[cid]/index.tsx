import { Channel as ChannelElement, MessageInput, MessageList, useChatContext } from "stream-chat-expo";
import { ActivityIndicator, Text, View, KeyboardAvoidingView, Platform } from "react-native";
import ConsultationMessageFooter from "@/src/components/ConsultationMessageFooter";
import { useCalls, useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import { SafeAreaView } from "react-native-safe-area-context";
import { chatStyles } from "@/src/shared/globalStyles";
import ChatHeader from "@/src/components/ChatHeader";
import { useLocalSearchParams } from "expo-router";
import utils from "@/src/shared/utils";
import uuid from "react-native-uuid";
import { useEffect } from "react";
import useAuthStore from "@/src/shared/authStore";

export default function IndividualChatScreen() {
  const me = useAuthStore((state) => state.me);
  const { cid } = useLocalSearchParams();
  const { client } = useChatContext();
  const [channelType, channelID] = (cid as string)?.split(":") || [null, null];
  const streamVideoClient = useStreamVideoClient();

  // const debugCalls = useCalls();
  // debugCalls.forEach((c) => c.leave()); // Clear all calls for debug
  // useEffect(() => {
  //   if (!me) {
  //     return;
  //   }
  //   console.log(`--- ${debugCalls.length} calls for (${utils.formatFullname(me)}) ---`);
  //   debugCalls.forEach((c, i) => console.log(`Call ${i + 1}:`, c.id, c.ringing));
  // }, [debugCalls, me]);

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
      // console.log("Something is empty, returning....");
      return;
    }

    const call = streamVideoClient.call("default", uuid.v4(), {
      reuseInstance: false,
    });
    console.log("Creating call to ", mother.name);
    await call.getOrCreate({
      ring: true,
      video: isVideo,
      data: {
        members: [{ user_id: streamVideoClient.state.connectedUser.id }, { user_id: mother.id }],
      },
    });
    console.log("Created call to ", mother.name);
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
