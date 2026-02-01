import { Stack } from "expo-router";

export default function DoctorHomeLayout() {
  return <Stack screenOptions={{ headerShown: false }} initialRouteName="index" />;
}
