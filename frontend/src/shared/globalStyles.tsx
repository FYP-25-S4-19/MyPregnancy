import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { colors, font, sizes, shadows } from "./designSystem";
import { StyleSheet } from "react-native";
import { DeepPartial, Theme } from "stream-chat-expo";

export const TAB_BAR_ICON_SIZE = 24;

export const globalStyles = StyleSheet.create({
  // Common container styles
  screenContainer: {
    flex: 1,
    backgroundColor: colors.veryLightPink, // Light pink background
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },

  // Header styles
  pageHeader: {
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.l,
  },
  pageHeaderTitle: {
    fontSize: font.xxl,
    fontWeight: "700",
    color: colors.text,
  },
});

// Profile-related reusable styles
export const profileStyles = StyleSheet.create({
  // Card styles
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.l,
    marginHorizontal: sizes.m,
    marginBottom: sizes.m,
    ...shadows.small,
  },
  cardTitle: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.l,
  },

  profilePageHeaderTitle: {
    marginLeft: sizes.m,
  },

  // Avatar styles
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFB3BA",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: font.xl,
    fontWeight: "700",
    color: colors.white,
  },

  // Profile header styles
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: sizes.l,
    gap: sizes.m,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.xs,
  },
  profileSubtext: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
    marginBottom: sizes.s,
  },

  // Button styles
  secondaryButton: {
    alignSelf: "flex-start",
    paddingVertical: sizes.xs,
    paddingHorizontal: sizes.m,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 100,
  },
  secondaryButtonText: {
    fontSize: font.xs,
    color: colors.text,
    fontWeight: "500",
  },

  // Form styles
  formContainer: {
    gap: sizes.m,
  },
  inputGroup: {
    gap: sizes.xs,
  },
  inputLabel: {
    fontSize: font.s,
    color: colors.black,
    opacity: 0.5,
    fontWeight: "500",
  },
  input: {
    // backgroundColor: colors.,
    borderRadius: sizes.borderRadius,
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    fontSize: font.s,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
});

export const chatStyles = StyleSheet.create({
  inputWrapper: {
    // paddingHorizontal: sizes.m,
    paddingBottom: sizes.xxl,
    backgroundColor: colors.white,
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
