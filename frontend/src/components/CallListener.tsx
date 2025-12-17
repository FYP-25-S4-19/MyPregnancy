import { useCalls, Call, CallingState } from "@stream-io/video-react-native-sdk";
import { router } from "expo-router";
import { useEffect } from "react";

export const CallListener = () => {
  const calls: Call[] = useCalls();

  useEffect(() => {
    calls.forEach((c) => {
      if (c.state.callingState !== CallingState.RINGING) {
        c.leave();
      }
    });

    const incomingRingingCall = calls.find((c) => c.state.callingState === CallingState.RINGING);
    if (incomingRingingCall) {
      router.replace(`/ringingCall`);
    }
  }, [calls]);

  return null;
};
