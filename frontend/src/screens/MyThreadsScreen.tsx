import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import MyThreadCard from "@/src/components/cards/MyThreadCard";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMyThreads } from "@/src/shared/hooks/useThreads";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";

interface MyThreadsScreenProps {
  onBack?: () => void;
  onThreadPress?: (threadId: number) => void;
  showBackButton?: boolean;
}

export default function MyThreadsScreen({ onBack, onThreadPress, showBackButton = true }: MyThreadsScreenProps) {
  const { data: threads, isLoading, isError, error, refetch } = useMyThreads();

  const handleBack = (): void => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleThreadPress = (threadId: number): void => {
    if (onThreadPress) {
      onThreadPress(threadId);
    } else {
      router.push(`/main/(notab)/threads/${threadId}`);
    }
  };

  const sortedThreads = useMemo(() => {
    if (!threads) return [];
    return [...threads].sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
  }, [threads]);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={styles.headerTitle}>My Thread</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error instanceof Error ? error.message : "Failed to load threads"}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !sortedThreads || sortedThreads.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>You haven&apos;t created any threads yet. Start a conversation!</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.threadsList}
          contentContainerStyle={styles.threadsListContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedThreads.map((thread, index) => (
            <MyThreadCard
              key={thread.id}
              thread={thread}
              onPress={() => handleThreadPress(thread.id)}
              isFirst={index === 0}
              isLast={index === sortedThreads.length - 1}
              stretchOut
            />
          ))}
          <View style={{ height: sizes.xl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  threadsList: {
    flex: 1,
  },
  threadsListContent: {
    paddingHorizontal: sizes.m,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: sizes.xl,
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
  emptyText: {
    fontSize: font.s,
    color: colors.text,
    textAlign: "center",
    opacity: 0.6,
  },
});
