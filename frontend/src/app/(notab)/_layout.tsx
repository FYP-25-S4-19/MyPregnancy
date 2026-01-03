import { Stack } from "expo-router";

export default function NoTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* all screens under (notab) */}
    </Stack>
  );
}
