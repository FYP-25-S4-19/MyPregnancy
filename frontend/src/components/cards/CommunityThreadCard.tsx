// src/components/cards/CommunityThreadCard.tsx

import useAuthStore from "@/src/shared/authStore";
import { colors, font, shadows, sizes } from "@/src/shared/designSystem";
import { useGuestGate } from "@/src/shared/hooks/useGuestGate";
import { useLikeThread, useUnlikeThread } from "@/src/shared/hooks/useThreads";
import { ThreadPreviewData } from "@/src/shared/typesAndInterfaces";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CommunityThreadCardProps {
  thread: ThreadPreviewData;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  stretchOut?: boolean;
  isGuest?: boolean;
}

export default function CommunityThreadCard({
  thread,
  onPress,
  isFirst,
  isLast,
  stretchOut,
  isGuest = false,
}: CommunityThreadCardProps) {
  const likeThreadMutation = useLikeThread();
  const unlikeThreadMutation = useUnlikeThread();
  const openGuestGate = useGuestGate((state) => state.open);

  const me = useAuthStore((s) => s.me);
  const isLoggedIn = !!me?.id;

  const openGuestGate = useGuestGate((s) => s.open);
  const pathname = usePathname();

  const handleLikePress = (e: any): void => {
    // Stop propagation to prevent triggering the card's onPress
    e.stopPropagation();

    // ✅ Guest: show modal instead of calling API
    if (!isLoggedIn) {
      openGuestGate(pathname || `/main/(notab)/threads/${thread.id}`);
      return;
    }

    if (thread.is_liked_by_current_user) {
      unlikeThreadMutation.mutate(thread.id, {
        onError: (error) => {
          Alert.alert("Error", "Failed to unlike thread. Please try again.");
          console.error("Unlike thread error:", error);
        },
      });
    } else {
      likeThreadMutation.mutate(thread.id, {
        onError: (error) => {
          Alert.alert("Error", "Failed to like thread. Please try again.");
          console.error("Like thread error:", error);
        },
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const categoryLabel = thread.category?.label ?? "General";

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isFirst && styles.firstCard,
        isLast && styles.lastCard,
        { width: stretchOut ? undefined : 300 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.threadTitle} numberOfLines={2} ellipsizeMode="tail">
        {thread.title}
      </Text>

      <Text style={styles.threadPreview} numberOfLines={2} ellipsizeMode="tail">
        {thread.content}
      </Text>

      <View style={styles.footer}>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{thread.creator_name}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.category}>{categoryLabel}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(thread.posted_at)}</Text>
        </View>

        <TouchableOpacity
          style={styles.likeContainer}
          onPress={handleLikePress}
          disabled={!isGuest && (likeThreadMutation.isPending || unlikeThreadMutation.isPending)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            style={[styles.likeIcon, thread.is_liked_by_current_user && styles.likeIconActive]}
            size={20}
            name={thread.is_liked_by_current_user ? "heart" : "heart-outline"}
          />
          <Text style={[styles.likeCount, thread.is_liked_by_current_user && styles.likeCountActive]}>
            {thread.like_count || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.s,
    paddingVertical: sizes.m,
    paddingHorizontal: sizes.l,
    marginBottom: 10,
    marginRight: sizes.m,
    ...shadows.small,
    height: 175,
    flexDirection: "column",
  },
  firstCard: { marginLeft: 0 },
  lastCard: { marginRight: sizes.m },
  threadTitle: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.s,
    lineHeight: 24,
    flexGrow: 0,
  },
  threadPreview: {
    fontSize: font.xs,
    color: colors.text,
    lineHeight: 20,
    marginBottom: sizes.m,
    flex: 1,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexGrow: 0,
    marginTop: "auto",
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorName: { fontSize: font.xs, color: colors.text, opacity: 0.6 },
  separator: { fontSize: font.xs, color: colors.text, opacity: 0.4, marginHorizontal: sizes.xs },
  category: { fontSize: font.xs, color: colors.text, opacity: 0.6 },
  timeAgo: { fontSize: font.xs, color: colors.text, opacity: 0.6 },
  likeContainer: { flexDirection: "row", alignItems: "center", gap: sizes.xs },
  likeIcon: { color: colors.text, opacity: 0.6 },
  likeIconActive: { color: colors.primary, opacity: 1 },
  likeCount: { fontSize: font.s, fontWeight: "500", color: colors.text, opacity: 0.6 },
  likeCountActive: { color: colors.primary, opacity: 1, fontWeight: "700" },
});
