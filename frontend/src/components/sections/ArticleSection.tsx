import { colors, font, sizes, shadows } from "@/src/shared/designSystem";
import { useArticlePreviewsQuery } from "@/src/shared/hooks/useArticles";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface ArticleSectionProps {
  onViewAll?: () => void;
}

export default function ArticleSection({ onViewAll }: ArticleSectionProps) {
  const { data: articles } = useArticlePreviewsQuery(5) || [];

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Articles</Text>

      <View style={styles.articlesContainer}>
        {articles?.map((article) => (
          <View key={article.id} style={styles.articleItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.articleTitle}>{article.title}</Text>
          </View>
        ))}
      </View>

      {onViewAll && (
        <TouchableOpacity style={styles.viewAllButton} onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.l,
    marginHorizontal: sizes.m,
    marginBottom: sizes.m,
    ...shadows.small,
  },
  title: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.m,
  },
  articlesContainer: {
    gap: sizes.xs,
    marginBottom: sizes.m,
  },
  articleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: sizes.s,
  },
  bullet: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "500",
    marginTop: 2,
  },
  articleTitle: {
    fontSize: font.s,
    color: colors.text,
    flex: 1,
  },
  viewAllButton: {
    alignSelf: "flex-end",
    paddingVertical: sizes.xs,
    paddingHorizontal: sizes.m,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: sizes.borderRadius,
  },
  viewAllText: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "500",
  },
});
