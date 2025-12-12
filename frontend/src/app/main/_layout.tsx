import { useCalls } from "@stream-io/video-react-native-sdk";
import { Redirect, Stack } from "expo-router";

export default function MainLayout() {
  const calls = useCalls().filter((c) => c.ringing);
  const ringingCall = calls.length > 0 ? calls[0] : null;
  if (ringingCall) {
    return <Redirect href="/(notab)/ringing" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
