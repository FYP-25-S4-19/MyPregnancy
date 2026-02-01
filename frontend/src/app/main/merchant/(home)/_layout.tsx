import { Stack } from "expo-router";

export default function MerchantHomeLayout() {
  return <Stack screenOptions={{ headerShown: false }} initialRouteName="index" />;
}
