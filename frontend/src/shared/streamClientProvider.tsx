import { StreamVideoClient, StreamVideo, User } from "@stream-io/video-react-native-sdk";
import React, { useEffect, useState, PropsWithChildren } from "react";
import { Chat, OverlayProvider } from "stream-chat-expo";
import streamTokenProvider from "./streamTokenProvider";
import { View, ActivityIndicator } from "react-native";
import { StreamChat } from "stream-chat";
import useAuthStore from "./authStore";
import utils from "./utils";

const PUBLIC_STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY!;

export function StreamClientProvider({ children }: PropsWithChildren) {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [isReady, setIsReady] = useState(false);

  const me = useAuthStore((state) => state.me);

  useEffect(() => {
    if (!me) {
      setChatClient(null);
      setVideoClient(null);
      setIsReady(true);
      return;
    }

    let isMounted = true;

    let currentChat: StreamChat | null = null;
    let currentVideo: StreamVideoClient | null = null;
    setIsReady(false);

    const initClients = async () => {
      try {
        const user: User = {
          id: me.id.toString(),
          name: utils.formatFullname(me),
          // image: me.profile_img_key,
        };

        // Chat setup - If the singleton is connected to someone else, disconnect first
        const chat = StreamChat.getInstance(PUBLIC_STREAM_API_KEY);
        if (chat.userID && chat.userID !== user.id) {
          await chat.disconnectUser();
        }

        if (chat.userID !== user.id) {
          await chat.connectUser(user, streamTokenProvider);
        }
        currentChat = chat;

        // Video setup
        let video = StreamVideoClient.getOrCreateInstance({
          apiKey: PUBLIC_STREAM_API_KEY,
          user,
          tokenProvider: streamTokenProvider,
        });

        // Handle User Mismatch for Video
        //
        // If the singleton exists but has a different user (from previous login),
        // we must disconnect and create a new instance.
        if (video.state.connectedUser && video.state.connectedUser.id !== user.id) {
          await video.disconnectUser();
          video = new StreamVideoClient({
            apiKey: PUBLIC_STREAM_API_KEY,
            user,
            tokenProvider: streamTokenProvider,
          });
        }
        currentVideo = video;

        if (isMounted) {
          setChatClient(chat);
          setVideoClient(video);
          setIsReady(true);
        }
      } catch (e) {
        console.error("Stream Init Failed", e);
        if (isMounted) setIsReady(true);
      }
    };
    initClients();

    return () => {
      isMounted = false;

      if (currentChat) {
        currentChat.disconnectUser().catch((e) => console.log("Chat disconnect error", e));
      }

      if (currentVideo) {
        currentVideo.disconnectUser().catch((e) => console.log("Video disconnect error", e));
      }

      setChatClient(null);
      setVideoClient(null);
    };
  }, [me?.id]); // Only re-run if the User ID changes

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!chatClient || !videoClient) {
    return <>{children}</>;
  }

  return (
    <OverlayProvider>
      <Chat client={chatClient}>
        <StreamVideo client={videoClient}>{children}</StreamVideo>
      </Chat>
    </OverlayProvider>
  );
}
