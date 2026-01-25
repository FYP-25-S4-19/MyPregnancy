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
import { useState } from "react";

export default function DoctorHomeScreen() {
  const me = useAuthStore((state) => state.me);
  const fullname = me ? utils.formatFullname(me) : "";
  const displayName = me ? `Dr. ${utils.formatFullname(me)}` : "Doctor";

  const [appointments] = useState([
    {
      id: 1,
      date: "Dec 11, 2025",
      time: "2:00 PM",
      patientName: "Angie",
      weekInfo: "Week 27",
    },
    {
      id: 2,
      date: "Dec 15, 2025",
      time: "12:00 PM",
      patientName: "Emily",
      weekInfo: "Week 2",
    },
    {
      id: 3,
      date: "Dec 22, 2025",
      time: "09:00 AM",
      patientName: "Jane",
      weekInfo: "Week 15",
    },
  ]);

  const pendingRequestsCount = 1;

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
            onPress={() => console.log("Navigate to pending requests")}
          />

          <UpcomingAppointmentsSection
            appointments={appointments}
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
