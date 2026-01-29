import { useDeleteArticle } from "@/src/shared/hooks/useArticles";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";
import { EduArticlePreviewData } from "@/src/shared/typesAndInterfaces";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { router } from "expo-router";

interface MyArticleCardProps {
  article: EduArticlePreviewData;
  onPress?: () => void;
  actor: "doctor" | "nutritionist";
  isFirst?: boolean;
  isLast?: boolean;
  stretchOut?: boolean;
}

export default function MyArticleCard({ article, onPress, actor, isFirst, isLast, stretchOut }: MyArticleCardProps) {
  const deleteArticleMutation = useDeleteArticle();

  const handleEditPress = (e: any): void => {
    e.stopPropagation();
    router.push(`/main/${actor}/(home)/my-articles/${article.id}/edit`);
  };

  const handleDeletePress = (e: any): void => {
    e.stopPropagation();
    Alert.alert("Delete Article", "Are you sure you want to delete this article? This action cannot be undone.", [
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: () => {
          deleteArticleMutation.mutate(article.id, {
            onError: (error) => {
              Alert.alert("Error", "Failed to delete article. Please try again.");
              console.error("Delete article error:", error);
            },
          });
        },
        style: "destructive",
      },
    ]);
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

  const categoryLabel = article.category?.label ?? "General";
  const trimesterLabel = `Trimester ${article.trimester}`;

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
      <Text style={styles.articleTitle} numberOfLines={2} ellipsizeMode="tail">
        {article.title}
      </Text>

      <View style={styles.footer}>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{article.author}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.category}>{categoryLabel}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.trimester}>{trimesterLabel}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(article.created_at)}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditPress} activeOpacity={0.7}>
          <MaterialCommunityIcons name="pencil" size={18} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeletePress}
          disabled={deleteArticleMutation.isPending}
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
    height: 140,
    flexDirection: "column",
  },
  firstCard: {
    marginLeft: 0,
  },
  lastCard: {
    marginRight: sizes.m,
  },
  articleTitle: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.s,
    lineHeight: 24,
    flexGrow: 0,
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
  trimester: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
  },
  timeAgo: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
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
