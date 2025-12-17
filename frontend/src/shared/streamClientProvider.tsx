import { useStreamConnection } from "./hooks/useStreamConnection";
import { StreamVideo } from "@stream-io/video-react-native-sdk";
import { Chat, OverlayProvider } from "stream-chat-expo";
import { View, ActivityIndicator } from "react-native";
import React, { PropsWithChildren } from "react";
import { globalStreamTheme } from "./globalStyles";

export function StreamClientProvider({ children }: PropsWithChildren) {
  const { chatClient, videoClient, isReady, isGuest } = useStreamConnection();

  if (isGuest) {
    return <>{children}</>;
  }

  // Connection in progress
  // We MUST show this, otherwise children mount and try to use context that doesn't exist
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render app without Stream Wrappers
  // This allows guests to use the app without crashing on missing ChatContext
  if (isGuest || !chatClient || !videoClient) {
    return <>{children}</>;
  }

  // Authenticated and Connected
  return (
    <OverlayProvider value={{ style: globalStreamTheme }}>
      <Chat client={chatClient}>
        <StreamVideo client={videoClient}>{children}</StreamVideo>
      </Chat>
    </OverlayProvider>
  );
}
