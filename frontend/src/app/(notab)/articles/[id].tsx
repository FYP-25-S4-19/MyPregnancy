import React, { useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import api from "@/src/shared/api";
import { colors, font, sizes } from "@/src/shared/designSystem";

type ArticleDetail = {
  id: number;
  category?: string | null;
  title?: string | null;
  content_markdown?: string | null;
};

function estimateReadTime(text?: string | null) {
  const t = (text ?? "").trim();
  if (!t) return "1 min read";
  const words = t.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

function cleanMarkdown(md?: string | null) {
  if (!md) return "";
  let s = md;

  // headings ### -> plain
  s = s.replace(/^#{1,6}\s+/gm, "");

  // bold/italic markers **text** or *text*
  s = s.replace(/\*\*(.*?)\*\*/g, "$1");
  s = s.replace(/\*(.*?)\*/g, "$1");

  // bullet lines "- " or "* " -> "• "
  s = s.replace(/^\s*[-*]\s+/gm, "• ");

  // cleanup extra spaces
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim();
}

export default function ArticleDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const goBackSafe = () => {
    router.replace("/main/mother/(home)/articles");
  };

  const articleQuery = useQuery({
    queryKey: ["article", id],
    queryFn: async () => {
      const res = await api.get(`/articles/${id}`);
      return res.data as ArticleDetail;
    },
    enabled: !!id,
  });

  const readTime = useMemo(() => estimateReadTime(articleQuery.data?.content_markdown), [articleQuery.data?.content_markdown]);
  const bodyText = useMemo(() => cleanMarkdown(articleQuery.data?.content_markdown), [articleQuery.data?.content_markdown]);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={goBackSafe} style={styles.iconBtn} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Article</Text>

        <View style={styles.iconBtn} />
      </View>

      {articleQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : articleQuery.isError || !articleQuery.data ? (
        <View style={styles.center}>
          <Text style={styles.helperTitle}>Couldn&apos;t load this article</Text>
          <Text style={styles.helperText}>Please try again.</Text>
          <TouchableOpacity onPress={() => articleQuery.refetch()} style={styles.retryBtn} activeOpacity={0.9}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.metaRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{String(articleQuery.data.category ?? "ARTICLE").toUpperCase()}</Text>
            </View>

            <View style={styles.metaRight}>
              <Ionicons name="time-outline" size={14} color={colors.tabIcon} />
              <Text style={styles.metaSmall}>{readTime}</Text>
            </View>
          </View>

          <Text style={styles.title}>{String(articleQuery.data.title ?? "Untitled")}</Text>

          <View style={styles.bodyCard}>
            <Text style={styles.body}>{bodyText}</Text>
          </View>

          <View style={{ height: sizes.xl }} />
        </ScrollView>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  headerTitle: {
    fontSize: font.l,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 0.2,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: sizes.xl },
  helperTitle: { fontSize: font.m, fontWeight: "900", color: colors.text, marginBottom: sizes.xs, textAlign: "center" },
  helperText: { fontSize: font.s, color: colors.tabIcon, textAlign: "center", marginBottom: sizes.m },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: sizes.xl,
    paddingVertical: sizes.s,
    borderRadius: sizes.borderRadius * 1.4,
  },
  retryText: { color: colors.white, fontWeight: "900" },

  content: { paddingHorizontal: sizes.l, paddingBottom: sizes.xl },

  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: sizes.m },
  metaRight: { flexDirection: "row", alignItems: "center", gap: 6 },

  categoryChip: {
    paddingHorizontal: sizes.m,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 214, 217, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  categoryText: { fontSize: 11, fontWeight: "900", color: colors.primary, letterSpacing: 0.8 },
  metaSmall: { fontSize: 12, fontWeight: "800", color: colors.tabIcon },

  title: { fontSize: font.l + 2, fontWeight: "900", color: colors.text, lineHeight: 30, marginBottom: sizes.l },

  bodyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: sizes.borderRadius * 1.6,
    padding: sizes.l,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  body: { fontSize: font.s, color: colors.text, lineHeight: 22 },
});
