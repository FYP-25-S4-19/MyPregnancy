import { TAB_BAR_ICON_SIZE, tabScreenOptions } from "@/src/shared/globalStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";

export default function NutritionistTabLayout() {
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
        name="recipe"
        options={{
          title: "Recipe",
          tabBarIcon: ({ color, size = TAB_BAR_ICON_SIZE }) => (
            <MaterialCommunityIcons name="food-fork-drink" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.navigate("/main/nutritionist/recipe");
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
