import { View, StyleSheet, TouchableOpacity, Text, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { colors, font, sizes } from "../shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FC, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../shared/api";
import { AppNotificationData, AppNotificationListResponse } from "../shared/typesAndInterfaces";

interface NotificationEntryProps {
  notification: AppNotificationData;
  onPress: () => void;
}

export const NotificationEntry: FC<NotificationEntryProps> = ({ notification, onPress }) => {
  const entryBgColor = notification.is_seen ? colors.white : colors.secondary;
  const formattedTime = formatNotificationTime(new Date(notification.sent_at));

  return (
    <TouchableOpacity onPress={onPress} style={[notifEntryStyles.container, { backgroundColor: entryBgColor }]}>
      <Text style={notifEntryStyles.timeText}>{formattedTime}</Text>
      <Text style={notifEntryStyles.contentText}>{notification.content}</Text>
    </TouchableOpacity>
  );
};

const notifEntryStyles = StyleSheet.create({
  container: {
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
  },
  timeText: {
    color: colors.text,
    marginBottom: sizes.s,
    fontSize: font.xs,
    fontWeight: "400",
  },
  contentText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "600",
    lineHeight: 22,
  },
});

//============================================================

interface NotificationGroupProps {
  title: string;
  notifications: AppNotificationData[];
  onNotificationPress: (notification: AppNotificationData) => void;
}

const NotificationGroup: FC<NotificationGroupProps> = ({ title, notifications, onNotificationPress }) => {
  return (
    <View style={groupStyles.container}>
      <Text style={groupStyles.groupTitle}>{title}</Text>
      {notifications.map((notif) => (
        <NotificationEntry key={notif.id} notification={notif} onPress={() => onNotificationPress(notif)} />
      ))}
    </View>
  );
};

const groupStyles = StyleSheet.create({
  container: {
    marginBottom: 0,
  },
  groupTitle: {
    fontSize: font.xs,
    fontWeight: "600",
    color: colors.text,
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    backgroundColor: colors.white,
  },
});

//============================================================

// Helper function to format notification times
function formatNotificationTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  if (diffDays === 0) {
    return `Today, ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday, ${timeStr}`;
  } else if (diffDays === 2) {
    return `2 Days Ago, ${timeStr}`;
  } else if (diffDays < 7) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    return `${dayName}, ${timeStr}`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "Last week" : `${weeks} weeks ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? "Last month" : `${months} months ago`;
  } else {
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
}

// Helper function to group notifications by time
function groupNotificationsByTime(
  notifications: AppNotificationData[],
): { title: string; notifications: AppNotificationData[] }[] {
  const groups = new Map<string, AppNotificationData[]>();

  notifications.forEach((notif) => {
    const date = new Date(notif.sent_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let groupKey: string;
    if (diffDays === 0) {
      groupKey = "Today";
    } else if (diffDays === 1) {
      groupKey = "Yesterday";
    } else if (diffDays === 2) {
      groupKey = "2 Days Ago";
    } else if (diffDays < 7) {
      groupKey = "This Week";
    } else if (diffDays < 30) {
      groupKey = "Last Week";
    } else {
      groupKey = "Older";
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(notif);
  });

  const order = ["Today", "Yesterday", "2 Days Ago", "This Week", "Last Week", "Older"];
  const result: { title: string; notifications: AppNotificationData[] }[] = [];

  order.forEach((key) => {
    if (groups.has(key)) {
      result.push({ title: key, notifications: groups.get(key)! });
    }
  });

  return result;
}

//============================================================

async function fetchNotifications(): Promise<AppNotificationData[]> {
  const response = await api.get<AppNotificationListResponse>("/notifications");
  return response.data.notifications || [];
}

async function markNotificationAsSeen(notificationId: number): Promise<void> {
  await api.patch(`/notifications/${notificationId}/seen`);
}

const NotificationScreen: FC = () => {
  const queryClient = useQueryClient();

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const groupedNotifications = useMemo(() => groupNotificationsByTime(notifications), [notifications]);

  const handleNotificationPress = async (notification: AppNotificationData) => {
    // Mark as seen
    if (!notification.is_seen) {
      try {
        await markNotificationAsSeen(notification.id);
        // Optimistically update the cache
        queryClient.setQueryData(["notifications"], (prev: AppNotificationData[] | undefined) => {
          if (!prev) return [];
          return prev.map((n) => (n.id === notification.id ? { ...n, is_seen: true } : n));
        });
      } catch (error) {
        console.error("Error marking notification as seen:", error);
      }
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "THREAD_LIKE":
      case "THREAD_COMMENT":
      case "COMMENT_REPLY":
      case "COMMENT_LIKE":
        if (notification.data?.thread_id) {
          router.push({
            pathname: "/main/(notab)/threads/[id]",
            params: { id: notification.data.thread_id.toString() },
          });
        }
        break;

      case "NEW_ARTICLE":
        if (notification.data?.article_id) {
          router.push({
            pathname: "/(notab)/articles/[id]",
            params: { id: notification.data.article_id.toString() },
          });
        }
        break;

      case "APPOINTMENT_REMINDER":
      case "APPOINTMENT_REQUEST":
        router.push("/main/mother/(home)");
        break;

      case "PRIVATE_MESSAGE":
        router.push("/main/mother/(home)/chats");
        break;

      default:
        console.log("Unknown notification type:", notification.type);
    }
  };

  return (
    <View style={notifScreenStyles.container}>
      <View style={notifScreenStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={notifScreenStyles.headerText}>Notifications</Text>
        {/* Invisible placeholder for alignment */}
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={notifScreenStyles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={notifScreenStyles.centerContainer}>
          <Text style={notifScreenStyles.errorText}>Failed to load notifications</Text>
          <TouchableOpacity style={notifScreenStyles.retryButton} onPress={() => refetch()}>
            <Text style={notifScreenStyles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={notifScreenStyles.centerContainer}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.lightGray} />
          <Text style={notifScreenStyles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={notifScreenStyles.scrollView}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} tintColor={colors.primary} />
          }
        >
          {groupedNotifications.map((group) => (
            <NotificationGroup
              key={group.title}
              title={group.title}
              notifications={group.notifications}
              onNotificationPress={handleNotificationPress}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const notifScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 140,
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    backgroundColor: colors.white,
  },
  headerText: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
  },
  scrollView: {
    paddingVertical: 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: sizes.m,
  },
  errorText: {
    color: colors.text,
    fontSize: font.s,
    marginBottom: sizes.m,
    textAlign: "center",
  },
  emptyText: {
    color: colors.text,
    fontSize: font.s,
    marginTop: sizes.m,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    borderRadius: 8,
    marginTop: sizes.m,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: font.s,
    fontWeight: "600",
  },
});

export default NotificationScreen;
