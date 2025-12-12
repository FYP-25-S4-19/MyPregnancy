import { RingingCallContent, StreamCall, useCalls } from "@stream-io/video-react-native-sdk";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";

export default function RingingScreen() {
  const calls = useCalls().filter((c) => c.ringing);
  const ringingCall = calls[0];

  useEffect(() => {
    if (!ringingCall) {
      router.replace("/");
    }
  }, [ringingCall]);
  if (!ringingCall) return null;

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
