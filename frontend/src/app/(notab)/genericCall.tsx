// app/(notab)/conversation.tsx
import { CallContent, StreamCall, useCalls } from "@stream-io/video-react-native-sdk";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";

export default function GenericCallScreen() {
  const calls = useCalls();
  const call = calls[0];

  useEffect(() => {
    if (!call) {
      router.replace("/");
    }
    const unsubscribe = call?.on("call.session_ended", () => {
      router.replace("/");
    });

    return () => unsubscribe?.();
  }, [call]);

  if (!call) return <View style={styles.container} />;

  return (
    <StreamCall call={call}>
      <SafeAreaView style={styles.container}>
        {/* CallContent handles "Dialing", "Active Video", and "Controls" automatically */}
        <CallContent onHangupCallHandler={() => router.replace("/")} />
      </SafeAreaView>
    </StreamCall>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
});
