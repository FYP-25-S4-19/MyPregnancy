import CommunityThreadsSection from "@/src/components/sections/CommunityThreadsSection";
import ConsultationSection from "@/src/components/sections/ConsultationSection";
import { ShopForYouAndBaby } from "@/src/components/sections/ShopForYouAndBaby";
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
            onNotificationPress={() => {
              router.push(`/main/mother/(home)/notifications`);
              // if (me?.id) {
              //   utils.registerForPushNofificationsAsync(me.id);
              // }
            }}
          />
          <BabySizeSection />
          <ShopForYouAndBaby onBackPress={() => router.push("/main/mother/shop")} />
          <JournalSection doFetchMetrics onEdit={() => router.push("/main/mother/journal")} />
          <ArticleSection onViewAll={() => router.push("/main/mother/articles")} />
          <View style={{ height: 20 }} />

          <CommunityThreadsSection
            onViewAll={() => router.push("/main/mother/(home)/threads")}
            onThreadPress={(threadID) => router.push(`/main/(notab)/threads/${threadID}`)}
          />

          <ConsultationSection onFindDoctorPressed={() => router.push("/main/mother/consultation")} />
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
