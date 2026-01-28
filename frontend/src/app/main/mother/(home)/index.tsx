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
import { ProductsSection } from "@/src/components/sections/ProductsSection";

import MenstrualCycleSection from "@/src/components/sections/MenstrualCycleSection";
import PrePregnancyPlanningSection from "@/src/components/sections/PrePregnancyPlanningSection";

import { useQuery } from "@tanstack/react-query";
import api from "@/src/shared/api";

type PregnancyStage = "planning" | "pregnant" | "postpartum";

type MyProfileResponse = {
  stage: PregnancyStage | null;
  pregnancy_week: number | null;
  expected_due_date: string | null;
  baby_date_of_birth: string | null;
};

function normalizeStage(profile?: MyProfileResponse | null): PregnancyStage {
  // Use backend stage if present
  if (profile?.stage) return profile.stage;

  // Helpful fallback:
  // If there is an EDD, assume pregnant; else assume planning
  if (profile?.expected_due_date) return "pregnant";

  return "planning";
}

export default function MotherHomeScreen() {
  const me = useAuthStore((state) => state.me);
  const fullname = me ? utils.formatFullname(me) : "";

  // Fetch pregnancy stage once (Home decides what to show)
  const { data: profile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      const res = await api.get<MyProfileResponse>("/accounts/me/profile");
      return res.data;
    },
    staleTime: 30_000,
  });

  const stage = normalizeStage(profile);

  const showPregnancyTracker = stage === "pregnant";
  const showMenstrualAndPlanning = stage === "planning" || stage === "postpartum";

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <HomePageHeader
            headerText={me ? utils.formatFullname(me) : ""}
            profilePicStrFallback={utils.firstLetterOfEveryWordCapitalized(fullname)}
            onNotificationPress={() => {
              router.push(`/main/mother/(home)/notifications`);
            }}
          />

          {/* ====== TRACKER AREA (stage-based) ====== */}
          {showPregnancyTracker && <BabySizeSection />}

          {showMenstrualAndPlanning && (
            <>
              <MenstrualCycleSection onOpen={() => router.push("/main/(notab)/menstrual")} />
              <PrePregnancyPlanningSection onOpen={() => router.push("/main/(notab)/planning")} />
            </>
          )}

          {/* ====== REST OF HOME ====== */}
          <ShopForYouAndBaby onBackPress={() => router.push("/main/mother/shop")} />
          <JournalSection doFetchMetrics onEdit={() => router.push("/main/mother/journal")} />
          <ArticleSection onViewAll={() => router.push("/main/mother/articles")} />
          <View style={{ height: 20 }} />

          <CommunityThreadsSection
            onViewAll={() => router.push("/main/mother/(home)/threads")}
            onThreadPress={(threadID) => router.push(`/main/(notab)/threads/${threadID}`)}
          />

          <ConsultationSection onFindDoctorPressed={() => router.push("/main/mother/consultation")} />
          <View style={{ height: sizes.l }} />

          <ProductsSection
            title="Shop"
            showAllCategoryOption
            onProductCardPress={(productId) =>
              router.push({ pathname: "/main/mother/(home)/shop/[id]", params: { id: String(productId) } } as any)
            }
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
});