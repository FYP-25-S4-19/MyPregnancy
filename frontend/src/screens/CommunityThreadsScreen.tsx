import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useThreadCategories, useThreadsPreviews } from "@/src/shared/hooks/useThreads";
import CommunityThreadCard from "@/src/components/cards/CommunityThreadCard";
import { ThreadCategoryData } from "@/src/shared/typesAndInterfaces";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import { router } from "expo-router";

type SortOption = "Latest" | "Popular";

interface CommunityThreadsScreenProps {
  onBack?: () => void;
  onThreadPress?: (threadId: number) => void;
  showBackButton?: boolean;
  actor?: "mother" | "doctor" | "nutritionist" | "merchant" | "guest";
}

export default function CommunityThreadsScreen({
  onBack,
  onThreadPress,
  showBackButton = true,
  actor = "mother",
}: CommunityThreadsScreenProps) {
  const isGuest = actor === "guest";
  const { data: threads, isLoading, isError, error, refetch } = useThreadsPreviews();
  const {
    data: threadCategories,
    isLoading: categoriesAreLoading,
    isError: categoriesHaveError,
    refetch: refetchCategories,
  } = useThreadCategories();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("Latest");

  // Memoize the categories list with "All" option prepended
  const categoriesWithAll = useMemo<ThreadCategoryData[]>(() => {
    if (!threadCategories) return [{ id: 0, label: "All" }];
    return [{ id: 0, label: "All" }, ...threadCategories];
  }, [threadCategories]);

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

  const handleMyThreadsPress = (): void => {
    if (isGuest) return;
    router.push(`/main/${actor}/(home)/my-threads`);
  };

  const handleCreateThreadPress = (): void => {
    if (isGuest) return;
    router.push(`/main/${actor}/(home)/my-threads/create`);
  };

  const filteredThreads = useMemo(() => {
    return threads
      ?.filter((thread) => {
        const matchesSearch =
          thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.content.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = selectedFilter === "All" || thread.category?.label === selectedFilter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === "Latest") {
          return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
        }
        // For "Popular", sort by like count
        return (b.like_count || 0) - (a.like_count || 0);
      });
  }, [threads, searchQuery, selectedFilter, sortBy]);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <Text style={styles.headerTitle}>{"Community Thread"}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search threads..."
          placeholderTextColor={colors.lightGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filters */}
      {categoriesAreLoading ? (
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
            {/* Loading skeleton for categories */}
            {[1, 2, 3, 4].map((index) => (
              <View key={index} style={[styles.filterButton, styles.filterButtonSkeleton]}>
                <ActivityIndicator size="small" color={colors.text} />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : categoriesHaveError ? (
        <View style={styles.categoriesErrorContainer}>
          <Text style={styles.categoriesErrorText}>Failed to load categories</Text>
          <TouchableOpacity onPress={() => refetchCategories()} style={styles.retryButtonSmall}>
            <Text style={styles.retryTextSmall}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ height: 53 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
            {categoriesWithAll.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.filterButton, selectedFilter === category.label && styles.filterButtonActive]}
                onPress={() => setSelectedFilter(category.label)}
              >
                <Text style={[styles.filterText, selectedFilter === category.label && styles.filterTextActive]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === "Latest" && styles.sortButtonActive]}
          onPress={() => setSortBy("Latest")}
        >
          <Text style={[styles.sortText, sortBy === "Latest" && styles.sortTextActive]}>Latest</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === "Popular" && styles.sortButtonActive]}
          onPress={() => setSortBy("Popular")}
        >
          <Text style={[styles.sortText, sortBy === "Popular" && styles.sortTextActive]}>Popular</Text>
        </TouchableOpacity>
      </View>

      {/* Threads List */}
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
      ) : !filteredThreads || filteredThreads.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedFilter !== "All"
              ? "No threads match your search"
              : "No threads yet. Be the first to start a conversation!"}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.threadsList}
          contentContainerStyle={styles.threadsListContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredThreads.map((thread, index) => (
            <CommunityThreadCard
              key={thread.id}
              thread={thread}
              onPress={() => handleThreadPress(thread.id)}
              isFirst={index === 0}
              isLast={index === filteredThreads.length - 1}
              stretchOut
              isGuest={isGuest}
            />
          ))}
          <View style={{ height: sizes.xl }} />
        </ScrollView>
      )}

      {/* Floating Action Buttons - Hidden for guests */}
      {!isGuest && (
        <View style={styles.floatingButtonsContainer}>
          <TouchableOpacity style={styles.floatingButtonLeft} onPress={handleMyThreadsPress} activeOpacity={0.8}>
            <Ionicons name="person" size={28} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.floatingButtonRight} onPress={handleCreateThreadPress} activeOpacity={0.8}>
            <Ionicons name="add" size={32} color={colors.white} />
          </TouchableOpacity>
        </View>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD6D9",
    marginHorizontal: sizes.m,
    marginBottom: sizes.m,
    borderRadius: sizes.l,
    paddingHorizontal: sizes.m,
    height: 50,
  },
  searchIcon: {
    marginRight: sizes.s,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    fontSize: font.s,
    color: colors.text,
  },
  filtersContainer: {
    paddingHorizontal: sizes.m,
    gap: sizes.s,
    marginBottom: sizes.m,
  },
  filterButton: {
    flex: 1,
    justifyContent: "center",
    alignContent: "center",

    paddingHorizontal: sizes.l,
    paddingVertical: sizes.s,
    borderRadius: sizes.l,
    backgroundColor: "#FFD6D9",
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "500",
    opacity: 0.7,
  },
  filterTextActive: {
    color: colors.white,
    opacity: 1,
  },
  filterButtonSkeleton: {
    opacity: 0.5,
    minWidth: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    marginBottom: sizes.m,
    gap: sizes.s,
  },
  categoriesErrorText: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
  },
  retryButtonSmall: {
    paddingVertical: sizes.xs,
    paddingHorizontal: sizes.m,
    backgroundColor: colors.primary,
    borderRadius: sizes.borderRadius,
  },
  retryTextSmall: {
    fontSize: font.xs,
    color: colors.white,
    fontWeight: "600",
  },
  sortContainer: {
    flexDirection: "row",
    paddingHorizontal: sizes.m,
    marginBottom: sizes.m,
    gap: sizes.m,
  },
  sortButton: {
    paddingVertical: sizes.s,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  sortButtonActive: {
    borderBottomColor: colors.text,
  },
  sortText: {
    fontSize: font.m,
    color: colors.text,
    opacity: 0.5,
  },
  sortTextActive: {
    fontWeight: "700",
    opacity: 1,
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
  floatingButtonsContainer: {
    position: "absolute",
    bottom: sizes.xl,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: sizes.l,
    zIndex: 10,
  },
  floatingButtonLeft: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  floatingButtonRight: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
