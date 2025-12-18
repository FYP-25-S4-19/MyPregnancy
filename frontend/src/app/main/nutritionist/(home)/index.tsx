import CommunityThreadsSection from "@/src/components/sections/CommunityThreadsSection";
import BabySizeSection from "@/src/components/sections/BabySizeSection";
import JournalSection from "@/src/components/sections/JournalSection";
import ArticleSection from "@/src/components/sections/ArticleSection";
import HomePageHeader from "@/src/components/headers/HomePageHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, ScrollView } from "react-native";
import { colors, sizes } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import utils from "@/src/shared/utils";
import { router } from "expo-router";

export default function MotherHomeScreen() {
  const me = useAuthStore((state) => state.me);
  const fullname = me ? utils.formatFullname(me) : "";

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <HomePageHeader
            headerText={me ? utils.formatFullname(me) : ""}
            profilePicStrFallback={utils.firstLetterOfEveryWordCapitalized(fullname)}
          />
          <ArticleSection onViewAll={() => router.push("/main/mother/(home)/journal")} />
          <View style={{ height: 20 }} />

          <CommunityThreadsSection
            onViewAll={() => router.push("/main/nutritionist/(home)/threads")}
            onThreadPress={(threadID) => router.push(`/main/(notab)/threads/${threadID}`)}
          />
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
  scrollView: {
    flex: 1,
  },
  bellIcon: {
    fontSize: 28,
  },
});
