import { TAB_BAR_ICON_SIZE, tabScreenOptions } from "@/src/shared/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";

export default function MerchantTabLayout() {
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
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size = TAB_BAR_ICON_SIZE }) => (
            <MaterialCommunityIcons name="shopping" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.navigate("/main/merchant/shop");
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size = TAB_BAR_ICON_SIZE }) => (
            <MaterialCommunityIcons name="human" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
