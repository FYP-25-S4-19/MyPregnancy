import CommunityThreadsSection from "@/src/components/sections/CommunityThreadsSection";
import ArticleSection from "@/src/components/sections/ArticleSection";
import HomePageHeader from "@/src/components/headers/HomePageHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from "react-native";
import { colors, sizes, font } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import utils from "@/src/shared/utils";
import { router } from "expo-router";

export default function MotherHomeScreen() {
  const me = useAuthStore((state) => state.me);
  const fullname = me ? utils.formatFullname(me) : "";

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <HomePageHeader
            headerText={fullname}
            profilePicStrFallback={utils.firstLetterOfEveryWordCapitalized(fullname)}
          />

          
          <ArticleSection
            onViewAll={() =>
              router.push("/main/nutritionist/(home)/articles")
            }
          />

          <View style={{ height: 20 }} />

          <CommunityThreadsSection
            onViewAll={() =>
              router.push("/main/nutritionist/(home)/threads")
            }
            onThreadPress={(threadID) =>
              router.push(`/main/(notab)/threads/${threadID}`)
            }
          />

          {/* ✅ Add Recipe Button */}
          <TouchableOpacity
            style={styles.addRecipeBtn}
            onPress={() => { 
              // router.replace("/main/nutritionist/recipe")
              router.push("/main/nutritionist/recipe/add")
            }}
          >
            <Text style={styles.addRecipeText}>＋ Add Recipe</Text>
          </TouchableOpacity>

          <View style={{ height: sizes.xl }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },
  addRecipeBtn: {
    marginHorizontal: sizes.l,
    marginTop: sizes.m,
    marginBottom: sizes.l,
    backgroundColor: colors.white,
    paddingVertical: sizes.m,
    borderRadius: sizes.s,
    alignItems: "flex-start",
  },
  addRecipeText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: sizes.m,
  },
});
