import {
  CallingState,
  RingingCallContent,
  StreamCall,
  useCalls,
  useStreamVideoClient,
} from "@stream-io/video-react-native-sdk";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";

export default function RingingScreen() {
  const allRingingCalls = useCalls().filter((c) => c.state.callingState === CallingState.RINGING);
  const ringingCall = allRingingCalls[0];
  // const vidClient = useStreamVideoClient();

  useEffect(() => {
    // console.log("All ringing calls len:", allRingingCalls.length, `for ${vidClient?.state.connectedUser?.name}`);

    if (!ringingCall) {
      router.replace("/");
    }
  }, [ringingCall]);
  if (!ringingCall) return null;
  // console.log(`There is a ringing call for me ${vidClient?.state.connectedUser?.name}`);

  return (
    <StreamCall call={ringingCall}>
      <SafeAreaView style={styles.container}>
        <RingingCallContent />
      </SafeAreaView>
    </StreamCall>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
