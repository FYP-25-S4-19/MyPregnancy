import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";
import { Ionicons } from "@expo/vector-icons";

const formatAppointmentDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatAppointmentTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

interface Appointment {
  appointment_id: string;
  doctor_name: string;
  mother_name: string;
  start_time: string;
  status: string;
}

interface UpcomingAppointmentsSectionProps {
  appointments?: Appointment[];
  onAppointmentPress?: (appointmentId: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  error?: Error | null;
}

export default function UpcomingAppointmentsSection({
  appointments = [],
  onAppointmentPress,
  isLoading = false,
  isError = false,
  error = null,
}: UpcomingAppointmentsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="calendar-outline" size={28} color={colors.text} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Upcoming Appointments</Text>
            <Text style={styles.subtitle}>{appointments.length} upcoming appointments</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : isError ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.errorText}>Failed to load appointments</Text>
            {error && <Text style={styles.errorDetailText}>{error.message}</Text>}
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming appointments</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {appointments.map((appointment, index) => (
              <TouchableOpacity
                key={appointment.appointment_id}
                style={[styles.appointmentCard, index === 0 && styles.firstCard]}
                onPress={() => onAppointmentPress?.(appointment.appointment_id)}
                activeOpacity={0.7}
              >
                <View style={styles.appointmentHeader}>
                  <Text style={styles.appointmentDate}>{formatAppointmentDate(appointment.start_time)}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.text} />
                </View>
                <Text style={styles.appointmentTime}>{formatAppointmentTime(appointment.start_time)}</Text>
                <Text style={styles.appointmentInfo}>{appointment.mother_name}</Text>
                <Text style={styles.appointmentWeek}>{appointment.status}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: sizes.m,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.l,
    marginHorizontal: sizes.m,
    ...shadows.small,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.m,
    marginBottom: sizes.m,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.xs / 2,
  },
  subtitle: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginBottom: sizes.m,
  },
  scrollContent: {
    gap: sizes.m,
  },
  appointmentCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: sizes.s,
    padding: sizes.m,
    width: 220,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  firstCard: {
    marginLeft: 0,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: sizes.xs,
  },
  appointmentDate: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
  },
  appointmentTime: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.text,
    marginBottom: sizes.s,
  },
  appointmentInfo: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.7,
    marginBottom: sizes.xs / 2,
  },
  appointmentWeek: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.7,
  },
  emptyContainer: {
    paddingVertical: sizes.l,
    alignItems: "center",
  },
  emptyText: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.6,
  },
  errorText: {
    fontSize: font.s,
    color: "#E74C3C",
    fontWeight: "600",
    marginBottom: sizes.s,
  },
  errorDetailText: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.6,
  },
});
