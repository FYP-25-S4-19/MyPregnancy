import { Stack } from "expo-router";

export default function MotherRecipeStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} initialRouteName="index" />;
}
