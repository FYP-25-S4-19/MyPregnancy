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
    marginLeft: sizes.xs,
  },
  input: {
    borderRadius: sizes.borderRadius,
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    fontSize: font.s,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },

  // Action button styles
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.s,
  },
  actionButtonText: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "500",
  },
  actionButtonArrow: {
    fontSize: font.l,
    color: colors.lightGray,
    fontWeight: "300",
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
      },
    },
  },
  channelListMessenger: {
    flatListContent: {
      backgroundColor: colors.white,
    },
  },
  channelPreview: {
    title: { color: colors.text },
    container: {
      backgroundColor: colors.white,
    },
  },
};

export const channelListStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: sizes.l,
  },
});

// Thread-related reusable styles
export const threadStyles = StyleSheet.create({
  // Thread Card
  threadCard: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.l,
    marginBottom: sizes.m,
    ...shadows.small,
  },
  threadTitle: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.m,
    lineHeight: 28,
  },
  threadContent: {
    fontSize: font.s,
    color: colors.text,
    lineHeight: 24,
    marginBottom: sizes.m,
  },
  threadMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: sizes.m,
  },
  metaText: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
  },
  metaSeparator: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.4,
    marginHorizontal: sizes.xs,
  },
  threadActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.l,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.xs,
  },
  likeCount: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.6,
  },
  likeCountActive: {
    color: colors.primary,
    opacity: 1,
    fontWeight: "600",
  },
  commentCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.xs,
  },
  commentCount: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.6,
  },

  // Comments Section
  commentsSection: {
    gap: sizes.m,
  },
  commentCard: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.m,
    marginBottom: sizes.s,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    ...shadows.small,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: sizes.s,
  },
  commentAuthor: {
    fontSize: font.s,
    fontWeight: "600",
    color: colors.text,
  },
  commentTime: {
    fontSize: font.xxs,
    color: colors.text,
    opacity: 0.5,
  },
  commentContent: {
    fontSize: font.s,
    color: colors.text,
    lineHeight: 22,
    marginBottom: sizes.s,
  },
  commentLikeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.xs,
    alignSelf: "flex-start",
  },
  commentLikeCount: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
  },
  commentLikeCountActive: {
    color: colors.primary,
    opacity: 1,
    fontWeight: "600",
  },
  noCommentsContainer: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.xl,
    alignItems: "center",
    ...shadows.small,
  },
  noCommentsText: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.6,
    textAlign: "center",
  },

  // Comment Input
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: sizes.s,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: sizes.l,
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    fontSize: font.s,
    color: colors.text,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    paddingHorizontal: sizes.l,
    paddingVertical: sizes.s,
    borderRadius: sizes.l,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  sendButtonText: {
    fontSize: font.s,
    color: colors.white,
    fontWeight: "600",
  },
  sendButtonTextDisabled: {
    color: colors.text,
    opacity: 0.5,
  },

  // Back Button
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
    gap: sizes.xs,
  },
  backButtonText: {
    fontSize: font.m,
    color: colors.text,
    fontWeight: "500",
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: sizes.xl,
  },
  errorText: {
    fontSize: font.m,
    color: colors.text,
    textAlign: "center",
    marginBottom: sizes.m,
  },
  errorBackButton: {
    marginTop: sizes.m,
    paddingHorizontal: sizes.xl,
    paddingVertical: sizes.m,
    backgroundColor: colors.primary,
    borderRadius: sizes.s,
  },
});

export const homeHorizontalScrollStyle = StyleSheet.create({
  section: {
    marginBottom: sizes.m,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: sizes.m,
    marginBottom: sizes.s,
  },
  sectionTitle: {
    marginHorizontal: sizes.xs,
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
  },
  viewAllText: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  scrollContent: {
    paddingLeft: sizes.m,
  },
  loadingContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: sizes.m,
  },
  errorContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: sizes.m,
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.l,
  },
  errorText: {
    fontSize: font.s,
    color: colors.text,
    textAlign: "center",
    marginBottom: sizes.m,
  },
  retryButton: {
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.l,
    backgroundColor: colors.primary,
    borderRadius: sizes.borderRadius,
  },
  retryText: {
    fontSize: font.s,
    color: colors.white,
    fontWeight: "600",
  },
  emptyContainer: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: sizes.m,
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.l,
  },
  emptyText: {
    fontSize: font.s,
    color: colors.text,
    textAlign: "center",
    opacity: 0.6,
  },
});
