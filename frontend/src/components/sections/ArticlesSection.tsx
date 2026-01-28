import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { homeHorizontalScrollStyle } from "@/src/shared/globalStyles";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import api from "@/src/shared/api";
import { FC } from "react";

interface ArticlePreview {
  id: number;
  title: string;
}

interface ArticlesSectionProps {
  onViewAll?: () => void;
  onArticlePress?: (articleId: number) => void;
}

const ArticlesSection: FC<ArticlesSectionProps> = ({ onViewAll, onArticlePress }) => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["articles", "previews", 3],
    queryFn: async () => {
      const response = await api.get<ArticlePreview[]>("/articles/previews?limit=3");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <View style={homeHorizontalScrollStyle.section}>
      {/* Header */}
      <View style={homeHorizontalScrollStyle.sectionHeader}>
        <Text style={homeHorizontalScrollStyle.sectionTitle}>Educational Articles</Text>
        {onViewAll && (
          <TouchableOpacity onPress={onViewAll}>
            <Text style={homeHorizontalScrollStyle.viewAllText}>View all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : !articles || articles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={homeHorizontalScrollStyle.emptyText}>No articles available</Text>
        </View>
      ) : (
        <View style={styles.articlesContainer}>
          {articles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              onPress={() => onArticlePress?.(article.id)}
              activeOpacity={0.8}
            >
              <View style={styles.articleContent}>
                <Ionicons name="newspaper-outline" size={24} color={colors.primary} style={styles.icon} />
                <Text style={styles.articleTitle} numberOfLines={2}>
                  {article.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.tabIcon} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: sizes.l,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: sizes.m,
  },
  articlesContainer: {
    paddingHorizontal: sizes.m,
    gap: sizes.s,
  },
  articleCard: {
    backgroundColor: "#FFF6F7",
    borderRadius: sizes.borderRadius,
    padding: sizes.m,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  articleContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.m,
  },
  icon: {
    flexShrink: 0,
  },
  articleTitle: {
    fontSize: font.s,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
});

export default ArticlesSection;
