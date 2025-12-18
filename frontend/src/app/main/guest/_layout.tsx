import { TAB_BAR_ICON_SIZE, tabScreenOptions } from "@/src/shared/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function GuestTabLayout() {
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size = TAB_BAR_ICON_SIZE }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
