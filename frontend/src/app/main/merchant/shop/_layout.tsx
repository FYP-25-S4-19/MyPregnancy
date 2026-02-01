import { Stack } from "expo-router";

export default function MerchantShopLayout() {
  return <Stack screenOptions={{ headerShown: false }} initialRouteName="index" />;
}
