import { useLikeThread, useUnlikeThread, useDeleteThread } from "@/src/shared/hooks/useThreads";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";
import { ThreadPreviewData } from "@/src/shared/typesAndInterfaces";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { router } from "expo-router";

interface MyThreadCardProps {
  thread: ThreadPreviewData;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  stretchOut?: boolean;
}

export default function MyThreadCard({
  thread,
  onPress,
  isFirst,
  isLast,
  stretchOut,
}: MyThreadCardProps) {
  const likeThreadMutation = useLikeThread();
  const unlikeThreadMutation = useUnlikeThread();
  const deleteThreadMutation = useDeleteThread();

  const handleLikePress = (e: any): void => {
    e.stopPropagation();

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

  const handleEditPress = (e: any): void => {
    e.stopPropagation();
    router.push(`/main/mother/(home)/my-threads/${thread.id}/edit`);
  };

  const handleDeletePress = (e: any): void => {
    e.stopPropagation();
    Alert.alert(
      "Delete Thread",
      "Are you sure you want to delete this thread? This action cannot be undone.",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            deleteThreadMutation.mutate(thread.id, {
              onError: (error) => {
                Alert.alert("Error", "Failed to delete thread. Please try again.");
                console.error("Delete thread error:", error);
              },
            });
          },
          style: "destructive",
        },
      ]
    );
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
          disabled={likeThreadMutation.isPending || unlikeThreadMutation.isPending}
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

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="pencil" size={18} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeletePress}
          disabled={deleteThreadMutation.isPending}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="trash-can" size={18} color={colors.white} />
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
    marginBottom: sizes.m,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorName: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
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
  actionButtons: {
    flexDirection: "row",
    gap: sizes.s,
    justifyContent: "flex-end",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#E74C3C",
    justifyContent: "center",
    alignItems: "center",
  },
});
