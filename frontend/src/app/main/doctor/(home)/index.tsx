import {
  usePendingAppointments,
  useUpcomingAppointments,
  usePendingAppointmentsCount,
} from "@/src/shared/hooks/useAppointments";
import UpcomingAppointmentsSection from "@/src/components/sections/UpcomingAppointmentsSection";
import CommunityThreadsSection from "@/src/components/sections/CommunityThreadsSection";
import PendingRequestsCard from "@/src/components/cards/PendingRequestsCard";
import PendingRequestsModal from "@/src/components/modals/PendingRequestsModal";
import ArticleSection from "@/src/components/sections/ArticleSection";
import HomePageHeader from "@/src/components/headers/HomePageHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { colors, sizes } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import utils from "@/src/shared/utils";
import { router } from "expo-router";
import { useState } from "react";
import api from "@/src/shared/api";

export default function DoctorHomeScreen() {
  const me = useAuthStore((state) => state.me);
  const fullname = me ? utils.formatFullname(me) : "";
  const displayName = me ? `Dr. ${utils.formatFullname(me)}` : "Doctor";

  const [showPendingModal, setShowPendingModal] = useState(false);
  const [navigatingAppointmentId, setNavigatingAppointmentId] = useState<string | null>(null);

  const { count: pendingRequestsCount, isLoading: pendingLoading } = usePendingAppointmentsCount();
  const { appointments: pendingAppointments, isLoading: pendingApptLoading } = usePendingAppointments();
  const { appointments, isLoading: appointmentsLoading, isError: appointmentsError, error } = useUpcomingAppointments();

  const navigateToChat = async (motherId: string, appointmentId: string) => {
    try {
      setNavigatingAppointmentId(appointmentId);
      const res = await api.post<{ channel_id: string }>("/stream/chat/channel/generic", {
        other_user_id: motherId,
      });
      router.replace(`/main/doctor/chat`);
      router.push(`/main/chat/${res.data.channel_id}`);
    } catch (err) {
      console.error("Channel error:", err);
      Alert.alert("Error", "Failed to open chat");
    } finally {
      setNavigatingAppointmentId(null);
    }
  };

  const handlePendingRequestPress = () => {
    setShowPendingModal(true);
  };

  const handlePendingAppointmentPress = (appointmentId: string) => {
    const appointment = pendingAppointments.find((appt) => appt.appointment_id === appointmentId);
    if (appointment) {
      navigateToChat(appointment.mother_id, appointmentId);
    }
  };

  const handleUpcomingAppointmentPress = (appointmentId: string) => {
    const appointment = appointments.find((appt) => appt.appointment_id === appointmentId);
    if (appointment) {
      navigateToChat(appointment.mother_id, appointmentId);
    }
  };

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
            onPress={handlePendingRequestPress}
          />

          <UpcomingAppointmentsSection
            appointments={appointments}
            isLoading={appointmentsLoading}
            isError={appointmentsError}
            error={error as Error | null}
            onAppointmentPress={handleUpcomingAppointmentPress}
          />

          <View style={{ height: sizes.xl }} />
        </ScrollView>
      </SafeAreaView>

      {/* Pending Requests Modal */}
      <PendingRequestsModal
        visible={showPendingModal}
        appointments={pendingAppointments}
        isLoading={pendingApptLoading}
        onClose={() => setShowPendingModal(false)}
        onAppointmentPress={handlePendingAppointmentPress}
        isNavigating={navigatingAppointmentId !== null}
      />
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
