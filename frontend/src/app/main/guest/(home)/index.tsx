import CommunityThreadsSection from "@/src/components/sections/CommunityThreadsSection";
import ConsultationSection from "@/src/components/sections/ConsultationSection";
import ArticleSection from "@/src/components/sections/ArticleSection";
import JournalSection from "@/src/components/sections/JournalSection";
import HomePageHeader from "@/src/components/headers/HomePageHeader";
import { useGuestGate } from "@/src/shared/hooks/useGuestGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, View } from "react-native";
import { colors, sizes } from "@/src/shared/designSystem";
import { router } from "expo-router";

export default function GuestHomeScreen() {
  const openGuestGate = useGuestGate((state) => state.open);

  const handleJournalEdit = () => {
    openGuestGate("/main/mother/journal");
  };

  const handleArticlesViewAll = () => {
    router.push("/main/guest/(home)/articles");
  };

  const handleThreadsViewAll = () => {
    router.push("/main/guest/(home)/threads");
  };

  const handleThreadPress = (threadID: number) => {
    router.push(`/main/(notab)/threads/${threadID}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <HomePageHeader greetingText="Hi, Mama!" headerText={""} isGuest={true} />
          <View style={{ height: 20 }} />

          {/* Journal Section - Edit button triggers guest modal */}
          <JournalSection doFetchMetrics={false} onEdit={handleJournalEdit} />

          {/* Articles Section - Can view articles but can't save/create */}
          <ArticleSection onViewAll={handleArticlesViewAll} />

          <View style={{ height: 20 }} />

          {/* Threads Section - Can view but can't like/comment */}
          <CommunityThreadsSection onViewAll={handleThreadsViewAll} onThreadPress={handleThreadPress} isGuest={true} />

          {/* Consultation Section - Always shows "No Upcoming Consultation" */}
          <ConsultationSection isGuest={true} />

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
