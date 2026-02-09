import { useCalls, Call, CallingState } from "@stream-io/video-react-native-sdk";
import { router } from "expo-router";
import { useEffect } from "react";

export const CallListener = () => {
  const calls: Call[] = useCalls();

  // Prevent repeatedly navigating on the same ringing call.
  // useEffect(() => {
  //   console.log(
  //     "Calls changed, call types: ",
  //     calls.map((c) => c.type),
  //   );
  //   calls.forEach((c) => {
  //     if (c) {
  //       c.endCall();
  //     }
  //   });
  //   console.log(
  //     "AFTER ending, call types: ",
  //     calls.map((c) => c.type),
  //   );

  //   //   console.log("Length of calls: ", calls.length);
  //   // console.log("Looking for ringing call....");
  //   // const ringingCall = calls.find((c) => c && c.state.callingState === CallingState.RINGING);
  //   // if (!ringingCall) {
  //   //   lastRingingCidRef.current = null;
  //   //   return;
  //   // }
  //   // console.log("We have a ringing call!");

  //   // // `cid` is stable for a call instance.
  //   // const cid = (ringingCall as any).cid as string | undefined;
  //   // if (cid && lastRingingCidRef.current === cid) return;
  //   // if (cid) lastRingingCidRef.current = cid;

  //   // console.log("The cid is: ", cid);

  //   // router.replace(`/ringingCall`);
  // }, [calls]);

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
