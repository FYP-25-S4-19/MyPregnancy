import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";

interface CommunityThread {
  id: string;
  title: string;
  author: string;
  replies: number;
  timeAgo: string;
  preview: string;
}

interface CommunityThreadsSectionProps {
  threads: CommunityThread[];
  onViewAll?: () => void;
  onThreadPress?: (threadId: string) => void;
}

export default function CommunityThreadsSection({ threads, onViewAll, onThreadPress }: CommunityThreadsSectionProps) {
  return (
    <View style={styles.section}>
      {/* Header outside the cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Community Threads</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal scrolling cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {threads.map((thread, index) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            onPress={() => onThreadPress?.(thread.id)}
            isFirst={index === 0}
            isLast={index === threads.length - 1}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface ThreadCardProps {
  thread: CommunityThread;
  onPress?: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function ThreadCard({ thread, onPress, isFirst, isLast }: ThreadCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, isFirst && styles.firstCard, isLast && styles.lastCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.authorAvatar}>
          <Text style={styles.avatarText}>{thread.author.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.authorName}>{thread.author}</Text>
          <Text style={styles.timeAgo}>{thread.timeAgo}</Text>
        </View>
      </View>

      <Text style={styles.threadTitle} numberOfLines={2}>
        {thread.title}
      </Text>

      <Text style={styles.threadPreview} numberOfLines={3}>
        {thread.preview}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.replyContainer}>
          <Text style={styles.replyIcon}>💬</Text>
          <Text style={styles.replyCount}>{thread.replies} replies</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const CARD_WIDTH = 280;

const styles = StyleSheet.create({
  section: {
    marginBottom: sizes.m,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: sizes.m,
    marginBottom: sizes.m,
  },
  sectionTitle: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
  },
  viewAllText: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "500",
  },
  scrollContent: {
    paddingLeft: sizes.m,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.m,
    width: CARD_WIDTH,
    marginRight: sizes.m,
    ...shadows.small,
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: sizes.m,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: sizes.s,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFB3BA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: sizes.s,
  },
  avatarText: {
    fontSize: font.xs,
    fontWeight: "700",
    color: colors.white,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: font.xs,
    fontWeight: "600",
    color: colors.text,
  },
  timeAgo: {
    fontSize: font.xxs,
    color: colors.text,
    opacity: 0.5,
  },
  threadTitle: {
    fontSize: font.s,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.xs,
    lineHeight: 22,
  },
  threadPreview: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.7,
    lineHeight: 18,
    marginBottom: sizes.s,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: sizes.xs,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  replyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.xs,
  },
  replyIcon: {
    fontSize: 14,
  },
  replyCount: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
  },
});
