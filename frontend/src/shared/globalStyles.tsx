import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { colors, font, sizes } from "./designSystem";
import { StyleSheet } from "react-native";
import { DeepPartial, Theme } from "stream-chat-expo";

export const TAB_BAR_ICON_SIZE = 24;

export const globalStyles = StyleSheet.create({});

export const chatStyles = StyleSheet.create({
  inputWrapper: {
    // paddingHorizontal: sizes.m,
    paddingBottom: sizes.xxl,
    backgroundColor: colors.background,
  },
});

export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.tabIcon,
  tabBarLabelStyle: {
    fontSize: font.xs,
    fontWeight: "600",
    // marginTop: -8,
  },
  tabBarStyle: {
    paddingTop: 8,
    // paddingBottom: sizes.m,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: "#fff",
  },
};

export const globalStreamTheme: DeepPartial<Theme> = {
  messageSimple: {
    content: {
      containerInner: {
        backgroundColor: colors.primary,
      },
      markdown: {
        text: {
          color: colors.white,
          fontWeight: "400",
        },
        // heading1: {
        //   color: "pink",
        // },
        // inlineCode: {
        //   fontSize: 10,
        // },
      },
    },
  },
};
