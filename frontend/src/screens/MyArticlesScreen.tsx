import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import MyArticleCard from "@/src/components/cards/MyArticleCard";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMyArticles } from "@/src/shared/hooks/useArticles";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";

interface MyArticlesScreenProps {
  onBack?: () => void;
  onArticlePress?: (articleId: number) => void;
  showBackButton?: boolean;
  actor: "doctor" | "nutritionist";
}

export default function MyArticlesScreen({
  onBack,
  onArticlePress,
  showBackButton = true,
  actor,
}: MyArticlesScreenProps) {
  const { data: articles, isLoading, isError, error, refetch } = useMyArticles();

  const handleBack = (): void => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleArticlePress = (articleId: number): void => {
    if (onArticlePress) {
      onArticlePress(articleId);
    } else {
      // Articles are viewed from the general articles tab, not a (notab) route
      // For now, just navigate back since we don't have a detail view implemented
      // router.push(`/main/(notab)/articles/${articleId}`);
    }
  };

  const sortedArticles = useMemo(() => {
    if (!articles) return [];
    return [...articles].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [articles]);

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
        <Text style={styles.headerTitle}>My Articles</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error instanceof Error ? error.message : "Failed to load articles"}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !sortedArticles || sortedArticles.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>You haven&apos;t created any articles yet. Start sharing knowledge!</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.articlesList}
          contentContainerStyle={styles.articlesListContent}
          showsVerticalScrollIndicator={false}
        >
          {sortedArticles.map((article, index) => (
            <MyArticleCard
              key={article.id}
              article={article}
              actor={actor}
              onPress={() => handleArticlePress(article.id)}
              isFirst={index === 0}
              isLast={index === sortedArticles.length - 1}
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
  articlesList: {
    flex: 1,
  },
  articlesListContent: {
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
