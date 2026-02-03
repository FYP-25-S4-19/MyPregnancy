import { useLikeThread, useUnlikeThread } from "@/src/shared/hooks/useThreads";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";
import { ThreadPreviewData } from "@/src/shared/typesAndInterfaces";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useGuestGate } from "@/src/shared/hooks/useGuestGate";
import React from "react";

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

  const handleLikePress = (e: any): void => {
    // Stop propagation to prevent triggering the card's onPress
    e.stopPropagation();

    // If guest, show registration modal
    if (isGuest) {
      openGuestGate(`/main/(notab)/threads/${thread.id}`);
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

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  // Get the category label, default to "General" if not set
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
      {/* Title sits at the top, taking necessary space up to 2 lines */}
      <Text style={styles.threadTitle} numberOfLines={2} ellipsizeMode="tail">
        {thread.title}
      </Text>

      {/* Preview takes up all remaining space, pushing footer down */}
      <Text style={styles.threadPreview} numberOfLines={2} ellipsizeMode="tail">
        {thread.content}
      </Text>

      {/* Footer sits at the bottom */}
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
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: sizes.m,
  },
  threadTitle: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.s,
    lineHeight: 24,
    // Ensure title doesn't grow beyond its content
    flexGrow: 0,
  },
  threadPreview: {
    fontSize: font.xs,
    color: colors.text,
    lineHeight: 20,
    marginBottom: sizes.m,
    // 2. CHANGE: Make this component flexible. It will occupy all remaining space.
    flex: 1,
    // Ensure text aligns to top of this flexible space
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // Ensure footer doesn't grow beyond its content
    flexGrow: 0,
    // Optional: ensure it sits exactly at bottom if padding calculations are slightly off
    marginTop: "auto",
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    // Removed flexWrap: 'wrap' here to ensure the row stays aligned nicely in the footer.
    // If names are very long, you might need to handle truncation on authorName instead.
  },
  authorName: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
    // Optional: Add max width or numberOfLines=1 here if names break the layout
  },
  separator: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.4,
    marginHorizontal: sizes.xs,
  },
  category: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
  },
  timeAgo: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.xs,
  },
  likeIcon: {
    color: colors.text,
    opacity: 0.6,
  },
  likeIconActive: {
    color: colors.primary,
    opacity: 1,
  },
  likeCount: {
    fontSize: font.s,
    fontWeight: "500",
    color: colors.text,
    opacity: 0.6,
  },
  likeCountActive: {
    color: colors.primary,
    opacity: 1,
    fontWeight: "700",
  },
});
