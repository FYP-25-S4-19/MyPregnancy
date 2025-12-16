import { CallingState, RingingCallContent, StreamCall, useCalls } from "@stream-io/video-react-native-sdk";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";
import IncomingCall from "@/src/screens/IncomingCallScreen";

export default function RingingScreen() {
  const allRingingCalls = useCalls().filter((c) => c.state.callingState === CallingState.RINGING);
  const ringingCall = allRingingCalls[0];

  useEffect(() => {
    if (!ringingCall) {
      router.replace("/");
    }
  }, [ringingCall]);
  if (!ringingCall) return null;

  return (
    <StreamCall call={ringingCall}>
      <SafeAreaView style={styles.container}>
        <RingingCallContent IncomingCall={IncomingCall} />
      </SafeAreaView>
    </StreamCall>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
