import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useProductDrafts, useDeleteProductDraftMutation } from "@/src/shared/hooks/useProducts";
import { colors, sizes, font } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { DraftCard } from "@/src/components/DraftCard";
import { router } from "expo-router";

export default function DraftsScreen() {
  const { data: drafts, isLoading } = useProductDrafts();
  const deleteProductDraftMutation = useDeleteProductDraftMutation();

  const handleDraftCardPress = (draftId: number): void => {
    router.push(`/main/merchant/shop/drafts/${draftId}`);
  };

  const handleDeleteDraft = (draftId: number): void => {
    Alert.alert("Delete Draft", "Are you sure you want to delete this draft?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteProductDraftMutation.mutate(draftId, {
            onSuccess: () => {
              Alert.alert("Success", "Draft deleted successfully");
            },
            onError: (err: any) => {
              console.log("Failed to delete draft", err);
              Alert.alert("Error", err.response?.data?.detail || "Failed to delete draft");
            },
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.pageTitle}>DRAFTS</Text>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !drafts || drafts.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>No product drafts yet. Create one to get started!</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                id={draft.id}
                name={draft.name}
                category={draft.category_label}
                price_cents={draft.price_cents}
                img_url={draft.img_url}
                isVisible={true}
                onPress={handleDraftCardPress}
                onDelete={handleDeleteDraft}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: sizes.l,
    paddingBottom: sizes.xl,
  },
  pageTitle: {
    fontSize: font.xxl,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    paddingVertical: sizes.xl,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: font.m,
    color: colors.tabIcon,
    textAlign: "center",
  },
});
