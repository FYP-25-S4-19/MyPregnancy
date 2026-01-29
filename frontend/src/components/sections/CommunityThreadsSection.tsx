import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { homeHorizontalScrollStyle } from "@/src/shared/globalStyles";
import { useThreadsPreviews } from "@/src/shared/hooks/useThreads";
import CommunityThreadCard from "../cards/CommunityThreadCard";
import { colors } from "@/src/shared/designSystem";
import { useEffect } from "react";

interface CommunityThreadsSectionProps {
  onViewAll?: () => void;
  onThreadPress?: (threadId: number) => void;
}

export default function CommunityThreadsSection({ onViewAll, onThreadPress }: CommunityThreadsSectionProps) {
  const { data: threads, isLoading, isError, error, refetch } = useThreadsPreviews(6);

  // useEffect(() => {
  //   console.log("Thread Data:", threads);
  // }, [threads]);

  if (isLoading) {
    return (
      <View style={homeHorizontalScrollStyle.section}>
        <View style={homeHorizontalScrollStyle.sectionHeader}>
          <Text style={homeHorizontalScrollStyle.sectionTitle}>Threads</Text>
          {/*<TouchableOpacity onPress={() => refetch()}>Refetch Threads</TouchableOpacity>*/}
        </View>
        <View style={homeHorizontalScrollStyle.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={homeHorizontalScrollStyle.section}>
        <View style={homeHorizontalScrollStyle.sectionHeader}>
          <Text style={homeHorizontalScrollStyle.sectionTitle}>Community Threads</Text>
        </View>
        <View style={homeHorizontalScrollStyle.errorContainer}>
          <Text style={homeHorizontalScrollStyle.errorText}>
            {error instanceof Error ? error.message : "Failed to load threads"}
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={homeHorizontalScrollStyle.retryButton}>
            <Text style={homeHorizontalScrollStyle.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!threads || threads.length === 0) {
    return (
      <View style={homeHorizontalScrollStyle.section}>
        <View style={homeHorizontalScrollStyle.sectionHeader}>
          <Text style={homeHorizontalScrollStyle.sectionTitle}>Threads</Text>
        </View>
        <View style={homeHorizontalScrollStyle.emptyContainer}>
          <Text style={homeHorizontalScrollStyle.emptyText}>No threads yet. Be the first to start a conversation!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={homeHorizontalScrollStyle.section}>
      {/* Header outside the cards */}
      <View style={homeHorizontalScrollStyle.sectionHeader}>
        <Text style={homeHorizontalScrollStyle.sectionTitle}>Threads</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={homeHorizontalScrollStyle.viewAllText}>View</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal scrolling cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={homeHorizontalScrollStyle.scrollContent}
      >
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
