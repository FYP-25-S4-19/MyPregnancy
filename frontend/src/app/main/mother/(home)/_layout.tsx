import { Stack } from "expo-router";

export default function MotherHomeLayout() {
  return <Stack screenOptions={{ headerShown: false }} initialRouteName="index" />;
}
