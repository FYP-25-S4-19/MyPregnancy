import { usePendingAppointmentsCount, useUpcomingAppointments } from "@/src/shared/hooks/useAppointments";
import UpcomingAppointmentsSection from "@/src/components/sections/UpcomingAppointmentsSection";
import CommunityThreadsSection from "@/src/components/sections/CommunityThreadsSection";
import PendingRequestsCard from "@/src/components/cards/PendingRequestsCard";
import ArticleSection from "@/src/components/sections/ArticleSection";
import HomePageHeader from "@/src/components/headers/HomePageHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, ScrollView } from "react-native";
import { colors, sizes } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import utils from "@/src/shared/utils";
import { router } from "expo-router";

export default function DoctorHomeScreen() {
  const me = useAuthStore((state) => state.me);
  const fullname = me ? utils.formatFullname(me) : "";
  const displayName = me ? `Dr. ${utils.formatFullname(me)}` : "Doctor";

  const { count: pendingRequestsCount, isLoading: pendingLoading } = usePendingAppointmentsCount();
  const { appointments, isLoading: appointmentsLoading, isError: appointmentsError, error } = useUpcomingAppointments();

  // useEffect(() => {
  //   router.setParams({ pendingRequests: pendingRequestsCount });
  // }, [pendingRequestsCount]);

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <HomePageHeader
            headerText={displayName}
            profilePicStrFallback={utils.firstLetterOfEveryWordCapitalized(fullname)}
            onNotificationPress={() => router.push(`/main/doctor/(home)/notifications`)}
          />

          <ArticleSection onViewAll={() => router.push("/main/doctor/articles")} />

          <CommunityThreadsSection
            onViewAll={() => router.push("/main/doctor/threads")}
            onThreadPress={(threadID) => router.push(`/main/(notab)/threads/${threadID}`)}
          />

          <PendingRequestsCard
            count={pendingRequestsCount}
            isLoading={pendingLoading}
            onPress={() => console.log("Navigate to pending requests")}
          />

          <UpcomingAppointmentsSection
            appointments={appointments}
            isLoading={appointmentsLoading}
            isError={appointmentsError}
            error={error as Error | null}
            onAppointmentPress={(appointmentId) => console.log("Navigate to appointment:", appointmentId)}
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
