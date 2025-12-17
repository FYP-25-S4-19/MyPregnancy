import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useThreadsPreviews } from "@/src/shared/hooks/useThreads";
import { colors, font, sizes } from "@/src/shared/designSystem";
import CommunityThreadCard from "../cards/CommunityThreadCard";
import React from "react";

interface CommunityThreadsSectionProps {
  onViewAll?: () => void;
  onThreadPress?: (threadId: number) => void;
}

export default function CommunityThreadsSection({ onViewAll, onThreadPress }: CommunityThreadsSectionProps) {
  const { data: threads, isLoading, isError, error, refetch } = useThreadsPreviews(5);

  if (isLoading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Threads</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Community Threads</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error instanceof Error ? error.message : "Failed to load threads"}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Threads</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No threads yet. Be the first to start a conversation!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {/* Header outside the cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Threads</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal scrolling cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {threads.map((thread, index) => (
          <CommunityThreadCard
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
