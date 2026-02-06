import { Text, View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useSavedArticles } from "@/src/shared/hooks/useArticles";
import { colors, sizes, font } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

/* ================= TYPES ================= */

type Trimester = 1 | 2 | 3;

const getTrimesterColor = (trimester: Trimester) => {
  switch (trimester) {
    case 1:
      return "#FFB6C1"; // 1st trimester
    case 2:
      return "#FFD700"; // 2nd trimester
    case 3:
      return "#87CEFA"; // 3rd trimester
    default:
      return "#D3D3D3";
  }
};

/* ================= COMPONENT PROPS ================= */

interface SavedArticlesScreenProps {
  onBack?: () => void;
  showBackButton?: boolean;
  actor?: "mother" | "doctor" | "nutritionist" | "merchant";
}

/* ================= SCREEN ================= */

export default function SavedArticlesScreen({
  onBack,
  showBackButton = true,
  actor = "mother",
}: SavedArticlesScreenProps) {
  const { data: articles, isLoading, isError, error, refetch } = useSavedArticles();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* ===== TOP BAR ===== */}
      <View style={styles.topBar}>
        {showBackButton ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}

        <Text style={styles.title}>Saved Articles</Text>
        <View style={styles.backBtn} />
      </View>

      {/* ===== CONTENT ===== */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error instanceof Error ? error.message : "Failed to load articles"}</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : !articles || articles.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bookmark-outline" size={64} color={colors.tabIcon} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No saved articles yet</Text>
          <Text style={styles.emptyText}>Articles you save will appear here for quick access.</Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.articleCard}
              activeOpacity={0.9}
              onPress={() => {
                const actorPath =
                  actor === "mother"
                    ? "mother"
                    : actor === "doctor"
                      ? "doctor"
                      : actor === "nutritionist"
                        ? "nutritionist"
                        : "merchant";
                router.push(`/main/${actorPath}/(home)/articles/${item.id}` as any);
              }}
            >
              <View style={styles.articleCardInner}>
                <View style={styles.cardHeader}>
                  <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
                  <Ionicons name="bookmark" size={20} color={colors.primary} />
                </View>

                <Text style={styles.articleTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                <Text style={styles.articleExcerpt} numberOfLines={2}>
                  {item.excerpt}
                </Text>

                <View style={styles.trimesterRow}>
                  <View
                    style={[styles.trimesterChip, { backgroundColor: getTrimesterColor(item.trimester as Trimester) }]}
                  >
                    <Text style={styles.trimesterText}>Trimester {item.trimester}</Text>
                  </View>

                  <View style={styles.openRow}>
                    <Text style={styles.openText}>Open</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.tabIcon} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
  },
  backBtn: { width: 40 },
  title: { fontSize: font.l, fontWeight: "900", color: colors.primary },

  listContent: { paddingBottom: sizes.xl },

  articleCard: {
    marginHorizontal: sizes.l,
    marginBottom: sizes.m,
  },
  articleCardInner: {
    backgroundColor: "#FFF6F7",
    borderRadius: sizes.borderRadius * 1.6,
    padding: sizes.m,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  categoryText: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 0.8,
  },

  articleTitle: {
    fontSize: font.m,
    fontWeight: "900",
    color: colors.text,
  },
  articleExcerpt: {
    marginTop: sizes.xs,
    fontSize: font.s,
    color: colors.tabIcon,
    lineHeight: 20,
  },

  trimesterRow: {
    marginTop: sizes.s,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  trimesterChip: {
    paddingHorizontal: sizes.s,
    paddingVertical: sizes.xs,
    borderRadius: sizes.l,
  },
  trimesterText: {
    fontSize: font.xs,
    fontWeight: "700",
    color: "#000",
  },

  openRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  openText: {
    fontSize: 12,
    color: colors.tabIcon,
    fontWeight: "900",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: sizes.xl,
  },

  emptyIcon: {
    marginBottom: sizes.m,
    opacity: 0.3,
  },
  emptyTitle: {
    fontSize: font.m,
    fontWeight: "900",
    color: colors.text,
    marginBottom: sizes.xs,
    textAlign: "center",
  },
  emptyText: {
    fontSize: font.s,
    color: colors.tabIcon,
    textAlign: "center",
    opacity: 0.6,
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
});
