import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import api from "@/src/shared/api";
import { colors, sizes, font } from "@/src/shared/designSystem";
import SearchBar from "@/src/components/SearchBar";

/* ================= TYPES ================= */

type ArticleOverview = {
  id: number;
  title: string;
  category: string;
  excerpt: string;
  trimester: number;
};

type ArticleCategory = {
  id: number;
  label: string;
};

/* ================= TRIMESTER SETUP ================= */

const TRIMESTERS = [1, 2, 3] as const;
type Trimester = typeof TRIMESTERS[number];

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

const goBackSafe = () => {
  router.replace("/main/mother/(home)");
};

/* ================= SCREEN ================= */

export default function ArticlesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTrimesters, setSelectedTrimesters] = useState<Trimester[]>([]);

  const handleSubmitSearch = () => {
    setSubmittedQuery(searchQuery.trim());
  };

  /* ================= CATEGORIES ================= */

  const categoriesQuery = useQuery({
    queryKey: ["articleCategories"],
    queryFn: async () => {
      const res = await api.get<ArticleCategory[]>("/articles/categories");
      return res.data;
    },
  });

  const categoryChips = useMemo(() => {
    const apiCats = categoriesQuery.data ?? [];
    return [{ id: -1, label: "All" } as ArticleCategory, ...apiCats];
  }, [categoriesQuery.data]);

  /* ================= ARTICLES ================= */

  const articlesQuery = useQuery({
    queryKey: ["articles", selectedCategory],
    queryFn: async () => {
      if (selectedCategory === "All") {
        const cats = (categoriesQuery.data ?? []).map((c) => c.label);
        const results = await Promise.all(
          cats.map(async (cat) => {
            const res = await api.get<ArticleOverview[]>(
              `/articles/?category=${encodeURIComponent(cat)}`
            );
            return res.data;
          })
        );

        const merged = results.flat();
        const map = new Map<number, ArticleOverview>();
        merged.forEach((a) => map.set(a.id, a));
        return Array.from(map.values());
      }

      const res = await api.get<ArticleOverview[]>(
        `/articles/?category=${encodeURIComponent(selectedCategory)}`
      );
      return res.data;
    },
    enabled: selectedCategory === "All" ? !!categoriesQuery.data?.length : true,
  });

  /* ================= FILTERING ================= */

  const filteredArticles = useMemo(() => {
    const list = articlesQuery.data ?? [];
    const q = submittedQuery.toLowerCase();

    return list.filter((a) => {
      const searchMatch =
        !q ||
        String(a.title ?? "")
          .toLowerCase()
          .includes(q);

      const trimesterMatch =
        selectedTrimesters.length === 0 ||
        selectedTrimesters.includes(a.trimester as Trimester);

      return searchMatch && trimesterMatch;
    });
  }, [articlesQuery.data, submittedQuery, selectedTrimesters]);

  const isLoading = categoriesQuery.isLoading || articlesQuery.isLoading;

  const toggleTrimester = (tri: Trimester) => {
    setSelectedTrimesters((prev) =>
      prev.includes(tri)
        ? prev.filter((t) => t !== tri)
        : [...prev, tri]
    );
  };

  /* ================= UI ================= */

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* ===== TOP BAR ===== */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goBackSafe} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Articles</Text>
        <View style={styles.backBtn} />
      </View>

      {/* ===== SEARCH ===== */}
      <View style={styles.searchWrap}>
        <SearchBar
          placeholder="Search articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSearchPress={handleSubmitSearch}
          onSubmitEditing={handleSubmitSearch}
        />
      </View>

      {/* ===== CATEGORY CHIPS ===== */}
      <View style={styles.chipsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoryChips}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.chipsContent}
          renderItem={({ item }) => {
            const active = item.label === selectedCategory;
            return (
              <TouchableOpacity
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategory(item.label)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ===== TRIMESTER CHIPS ===== */}
      <View style={styles.chipsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TRIMESTERS}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles.chipsContent}
          renderItem={({ item }) => {
            const active = selectedTrimesters.includes(item);
            return (
              <TouchableOpacity
                style={[
                  styles.chip,
                  active && styles.chipActive,
                  active && { backgroundColor: getTrimesterColor(item) },
                ]}
                onPress={() => toggleTrimester(item)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  TRIMESTER {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ===== CONTENT ===== */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredArticles}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.articleCard}
              activeOpacity={0.9}
              onPress={() =>
                router.push({
                  pathname: "/(notab)/articles/[id]",
                  params: { id: String(item.id) },
                } as any)
              }
            >
              <View style={styles.articleCardInner}>
                <Text style={styles.categoryText}>
                  {item.category.toUpperCase()}
                </Text>

                <Text style={styles.articleTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                <Text style={styles.articleExcerpt} numberOfLines={2}>
                  {item.excerpt}
                </Text>

                <View style={styles.trimesterRow}>
                  <View
                    style={[
                      styles.trimesterChip,
                      { backgroundColor: getTrimesterColor(item.trimester as Trimester) },
                    ]}
                  >
                    <Text style={styles.trimesterText}>
                      Trimester {item.trimester}
                    </Text>
                  </View>

                  <View style={styles.openRow}>
                    <Text style={styles.openText}>Open</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.tabIcon}
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No articles found</Text>
          }
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

  searchWrap: { marginBottom: sizes.s },

  chipsWrap: { marginBottom: sizes.s },
  chipsContent: { paddingHorizontal: sizes.m, gap: sizes.s },

  chip: {
    backgroundColor: "#FFE9EC",
    paddingHorizontal: sizes.l,
    paddingVertical: sizes.s,
    borderRadius: sizes.l,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: "transparent",
  },
  chipText: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  chipTextActive: { color: colors.white, opacity: 1 },

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

  categoryText: {
    fontSize: 11,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
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

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: {
    textAlign: "center",
    marginTop: sizes.xl,
    color: colors.tabIcon,
  },
});
