import { useCalls, Call, CallingState } from "@stream-io/video-react-native-sdk";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";

export const CallListener = () => {
  const calls: Call[] = useCalls();

  const ringingCall = useMemo(
    () => calls.find((c) => c.state.callingState === CallingState.RINGING),
    [calls],
  );

  // Prevent repeatedly navigating on the same ringing call.
  const lastRingingCidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ringingCall) {
      lastRingingCidRef.current = null;
      return;
    }

    // `cid` is stable for a call instance.
    const cid = (ringingCall as any).cid as string | undefined;
    if (cid && lastRingingCidRef.current === cid) return;
    if (cid) lastRingingCidRef.current = cid;

    router.replace(`/ringingCall`);
  }, [ringingCall]);

  return null;
};
