import { useCalls, Call, CallingState } from "@stream-io/video-react-native-sdk";
import useAuthStore from "../shared/authStore";
import { router } from "expo-router";
import utils from "../shared/utils";
import { useEffect } from "react";

export const CallListener = () => {
  const me = useAuthStore((state) => state.me);
  const calls: Call[] = useCalls();

  useEffect(() => {
    //---------- DEBUG ---------
    // calls.forEach((c) => c.leave());
    // if (!me) {
    //   console.log("This is literally impossible");
    //   return;
    // }
    // console.log(`--- There are ${calls.length} calls for ${utils.formatFullname(me)}`);
    // calls.forEach((call, index) => {
    //   console.log(`Call ${index + 1}: ID=${call.id}, State=${call.state.callingState}`);
    // });
    // console.log();
    //-------- END DEBUG ----------

    const ringingCall = calls.find((c) => c.state.callingState === CallingState.RINGING);
    if (ringingCall) {
      router.push("/(notab)/ringing");
    }
  }, [calls]);

  return null;
};
