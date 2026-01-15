import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import api from "@/src/shared/api";
import { colors, sizes } from "@/src/shared/designSystem";

type DraftRecipe = {
  id: number;
  name: string | null;
  description: string | null;
  img_key: string | null;
  updated_at: string;
  trimester: number | null;
};

const getImageUrl = (imgKey: string | null) => {
  if (!imgKey) {
    return "https://via.placeholder.com/150";
  }
  return `${process.env.EXPO_PUBLIC_API_URL}/files/${imgKey}`;
};

export default function NutritionistRecipeDraftsScreen() {
  const [drafts, setDrafts] = useState<DraftRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const res = await api.get<DraftRecipe[]>("/recipes/drafts/");
        setDrafts(res.data);
      } catch (err) {
        console.log("Failed to fetch drafts", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, []);

  const renderItem = ({ item }: { item: DraftRecipe }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: "/main/nutritionist/recipe/addRecipe",
          params: {
            draftId: item.id.toString(),
            mode: "edit",
          },
        })
      }
    >
      <Image source={{ uri: getImageUrl(item.img_key) }} style={styles.image} />

      <View style={styles.content}>
        <Text style={styles.title}>
          {item.name ?? "Untitled Recipe"}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {item.description ?? "Draft not completed yet"}
        </Text>

        <Text style={styles.updatedAt}>
          Last edited {new Date(item.updated_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.header}>DRAFT</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" />
      ) : drafts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No draft recipes</Text>
          <Text style={styles.emptyText}>
            Recipes saved as draft will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: sizes.l }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
    paddingHorizontal: sizes.l,
  },
  header: {
    textAlign: "center",
    fontSize: sizes.l,
    fontWeight: "700",
    marginVertical: sizes.l,
    color: colors.black,
    letterSpacing: 1,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: sizes.l,
    padding: sizes.s,
    marginBottom: sizes.m,
    elevation: 3,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: sizes.m,
  },
  content: {
    flex: 1,
    marginLeft: sizes.m,
    justifyContent: "center",
  },
  title: {
    fontSize: sizes.m,
    fontWeight: "700",
    color: colors.black,
  },
  description: {
    fontSize: sizes.s,
    color: colors.black,
    marginTop: 4,
  },
  updatedAt: {
    fontSize: sizes.xs,
    color: colors.lightGray,
    marginTop: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: sizes.l,
    fontWeight: "700",
    color: colors.black,
  },
  emptyText: {
    marginTop: 6,
    color: colors.black,
    textAlign: "center",
  },
});
