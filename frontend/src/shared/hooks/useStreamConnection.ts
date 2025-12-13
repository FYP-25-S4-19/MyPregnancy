import { StreamVideoClient, User } from "@stream-io/video-react-native-sdk";
import streamTokenProvider from "../streamTokenProvider";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import useAuthStore from "../authStore";
import utils from "../utils";

const API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY!;

const chatClient = StreamChat.getInstance(API_KEY);

export const useStreamConnection = () => {
  const [isReady, setIsReady] = useState(false);
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);

  const me = useAuthStore((state) => state.me);

  useEffect(() => {
    let isMounted = true;

    // We are "Ready" to render the app, but without clients.
    if (!me) {
      if (chatClient.userID) chatClient.disconnectUser();
      setVideoClient(null);
      setIsReady(true);
      return;
    }

    // CASE 2: Authenticated User -> Connect
    const connect = async () => {
      setIsReady(false); // Show loading spinner

      try {
        const user: User = {
          id: me.id.toString(),
          name: utils.formatFullname(me),
          // image: me.avatar_key // Use redirect URL or public URL here if needed
        };

        // --- Chat Setup ---
        // Only connect if we aren't already connected as this user
        if (chatClient.userID !== user.id) {
          if (chatClient.userID) await chatClient.disconnectUser();
          await chatClient.connectUser(user, streamTokenProvider);
        }

        // --- Video Setup ---
        // Video client is lighter weight, we can instantiate it cleanly
        const _videoClient = StreamVideoClient.getOrCreateInstance({
          apiKey: API_KEY,
          user,
          tokenProvider: streamTokenProvider,
        });

        if (isMounted) {
          setVideoClient(_videoClient);
          setIsReady(true);
        }
      } catch (error) {
        console.error("Stream connection failed", error);
        // Even if it fails, we should probably let the user into the app,
        // just without chat functionality, or show an error screen.
        if (isMounted) setIsReady(true);
      }
    };

    connect();

    return () => {
      isMounted = false;
      // We generally do NOT disconnect Chat on unmount in React Native
      // to keep the socket alive for background events.
    };
  }, [me?.id]); // Re-run if the logged-in user changes

  return {
    chatClient: me ? chatClient : null,
    videoClient,
    isReady,
    isGuest: !me,
  };
};
