import { StreamVideoClient, User as StreamUser } from "@stream-io/video-react-native-sdk";
import streamTokenProvider from "@/src/shared/streamTokenProvider";
import useAuthStore from "@/src/shared/authStore";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import utils from "../utils";

const API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY!;

export const useStreamSetup = () => {
  const me = useAuthStore((state) => state.me);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const isValidAuth = me && utils.safeDecodeUnexpiredJWT(accessToken || "") !== null;

    if (!isValidAuth) {
      const asyncCleanup = async (): Promise<void> => {
        if (chatClient) {
          try {
            await chatClient.disconnectUser();
            console.log("Chat client disconnected");
          } catch (error) {
            console.error("Error disconnecting chat client:", error);
          }
        }

        if (videoClient) {
          try {
            await videoClient.disconnectUser();
            console.log("Video client disconnected");
          } catch (error) {
            console.error("Error disconnecting video client:", error);
          }
        }

        setChatClient(null);
        setVideoClient(null);
        setIsReady(false);
      };
      asyncCleanup();
      return;
    }

    if (chatClient?.userID === me.id.toString() && videoClient) {
      return;
    }

    const initClientsAsync = async (): Promise<void> => {
      try {
        const user: StreamUser = {
          id: me.id.toString(),
          name: utils.formatFullname(me),
          // image: ....TODO,
        };

        const chatInstance = StreamChat.getInstance(API_KEY);
        const videoInstance = StreamVideoClient.getOrCreateInstance({
          apiKey: API_KEY,
          user: user,
          tokenProvider: streamTokenProvider,
        });

        if (!chatInstance.userID || chatInstance.userID !== me.id.toString()) {
          await chatInstance.connectUser(user, streamTokenProvider);
          console.log("Chat client connected");
        }

        setChatClient(chatInstance);
        setVideoClient(videoInstance);
        setIsReady(true);

        console.log("Stream clients initialized");
      } catch (error) {
        console.error("Failed to initialize Stream clients:", error);
        setIsReady(false);
      }
    };
    initClientsAsync();

    // Cleanup on unmount
    return () => {
      // Don't cleanup here - let the next effect run handle it
      // This prevents disconnecting when component re-renders
    };
  }, [me?.id]); // Only depend on user ID!

  return { chatClient, videoClient, isReady };
};
