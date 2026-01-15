import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import api from "@/src/shared/api";
import { colors, sizes, font } from "@/src/shared/designSystem";
import SearchBar from "@/src/components/SearchBar";

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

const goBackSafe = () => {
  router.replace("/main/mother/(home)");
};

const getTrimesterColor = (trimester: number) => {
  switch (trimester) {
    case 1:
      return "#FFB6C1"; // Light Pink for 1st trimester
    case 2:
      return "#FFD700"; // Gold for 2nd trimester
    case 3:
      return "#87CEFA"; // Light Blue for 3rd trimester
    default:
      return "#D3D3D3"; // Grey as fallback
  }
};


export default function ArticlesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedChip, setSelectedChip] = useState<string>("All");

  const handleSubmitSearch = () => setSubmittedQuery(searchQuery.trim());

  const categoriesQuery = useQuery({
    queryKey: ["articleCategories"],
    queryFn: async () => {
      const res = await api.get<ArticleCategory[]>("/articles/categories");
      return res.data;
    },
  });

  const chips = useMemo(() => {
    const apiCats = categoriesQuery.data ?? [];
    return [{ id: -1, label: "All" } satisfies ArticleCategory, ...apiCats];
  }, [categoriesQuery.data]);

  const articlesQuery = useQuery({
    queryKey: ["articles", selectedChip],
    queryFn: async () => {
      if (selectedChip === "All") {
        const apiCats = (categoriesQuery.data ?? []).map((c) => c.label);
        const results = await Promise.all(
          apiCats.map(async (cat) => {
            const res = await api.get<ArticleOverview[]>(`/articles/?category=${encodeURIComponent(cat)}`);
            return res.data;
          }),
        );
        const merged = results.flat();
        const map = new Map<number, ArticleOverview>();
        merged.forEach((a) => {
          if (a && typeof a.id === "number") map.set(a.id, a);
        });
        return Array.from(map.values());
      }

      const res = await api.get<ArticleOverview[]>(`/articles/?category=${encodeURIComponent(selectedChip)}`);
      return res.data;
    },
    enabled: selectedChip === "All" ? !!categoriesQuery.data?.length : true,
  });

  const filtered = useMemo(() => {
    const list = articlesQuery.data ?? [];
    const q = submittedQuery.trim().toLowerCase();
    if (!q) return list;

    return list.filter((a) =>
      String(a?.title ?? "")
        .toLowerCase()
        .includes(q),
    );
  }, [articlesQuery.data, submittedQuery]);

  const isLoading = categoriesQuery.isLoading || articlesQuery.isLoading;

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goBackSafe} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Articles</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          placeholder="Search articles..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSearchPress={handleSubmitSearch}
          onSubmitEditing={handleSubmitSearch}
        />
      </View>

      <View style={styles.chipsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={chips}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.chipsContent}
          renderItem={({ item }) => {
            const active = item.label === selectedChip;
            return (
              <TouchableOpacity
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedChip(item.label)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {String(item.label).toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : categoriesQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.helper}>Failed to load categories</Text>
          <TouchableOpacity onPress={() => categoriesQuery.refetch()}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : articlesQuery.isError ? (
        <View style={styles.center}>
          <Text style={styles.helper}>Failed to load articles</Text>
          <TouchableOpacity onPress={() => articlesQuery.refetch()}>
            <Text style={styles.retry}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
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
                <View style={styles.metaRow}>
                  <Text style={styles.categoryText}>{String(item.category ?? "ARTICLE").toUpperCase()}</Text>
                </View>

                <Text style={styles.articleTitle} numberOfLines={2}>
                  {String(item.title ?? "Untitled")}
                </Text>

                <Text style={styles.articleExcerpt} numberOfLines={2}>
                  {String(item.excerpt ?? "")}
                </Text>

                <View style={styles.openRow}>
                  <Text style={styles.openText}>Open</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.tabIcon} />
                </View>

                <View style={styles.metaRow}>
                  <View style={[styles.trimesterChip, { backgroundColor: getTrimesterColor(item.trimester) }]}>
                    <Text style={styles.trimesterText}>Trimester {item.trimester}</Text>
                  </View>
                </View>

              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No articles found</Text>}
        />
      )}
    </SafeAreaView>
  );
}

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

  chipsWrap: { marginBottom: sizes.m },
  chipsContent: { paddingHorizontal: sizes.m, gap: sizes.s },
  chip: {
    backgroundColor: "#FFE9EC",
    paddingHorizontal: sizes.l,
    paddingVertical: sizes.s,
    borderRadius: sizes.l,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  chipActive: { backgroundColor: colors.primary, borderColor: "transparent" },
  chipText: { fontSize: font.xs, color: colors.text, opacity: 0.6, fontWeight: "900", letterSpacing: 0.5 },
  chipTextActive: { color: colors.white, opacity: 1 },

  listContent: { paddingBottom: sizes.xl, paddingTop: sizes.xs },
  articleCard: { marginHorizontal: sizes.l, marginBottom: sizes.m },
  articleCardInner: {
    backgroundColor: "#FFF6F7",
    borderRadius: sizes.borderRadius * 1.6,
    padding: sizes.m,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: sizes.xs },
  metaRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaSmall: { fontSize: 12, color: colors.tabIcon, fontWeight: "800" },

  categoryText: { fontSize: 11, fontWeight: "900", color: colors.primary, letterSpacing: 0.8 },

  articleTitle: { fontSize: font.m, fontWeight: "900", color: colors.text },
  articleExcerpt: { marginTop: sizes.xs, fontSize: font.s, color: colors.tabIcon, lineHeight: 20 },

  openRow: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: sizes.s, gap: 6 },
  openText: { fontSize: 12, color: colors.tabIcon, fontWeight: "900" },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  helper: { color: colors.tabIcon, marginBottom: sizes.s },
  retry: { color: colors.primary, fontWeight: "900" },
  empty: { textAlign: "center", marginTop: sizes.xl, color: colors.tabIcon },

  trimesterChip: {
    paddingHorizontal: sizes.s,
    paddingVertical: sizes.xs ,
    borderRadius: sizes.l,
    marginLeft: sizes.s,
  },
  trimesterText: {
    fontSize: font.xs,
    fontWeight: "700",
    color: "BLACK", 
    letterSpacing: 0.5,
  },


});
