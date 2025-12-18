import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface Appointment {
  id: number;
  date: string;
  time: string;
  patientName: string;
  weekInfo: string;
}

interface UpcomingAppointmentsSectionProps {
  appointments?: Appointment[];
  onAppointmentPress?: (appointmentId: number) => void;
}

export default function UpcomingAppointmentsSection({
  appointments = [],
  onAppointmentPress,
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

        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming appointments</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {appointments.map((appointment, index) => (
              <TouchableOpacity
                key={appointment.id}
                style={[styles.appointmentCard, index === 0 && styles.firstCard]}
                onPress={() => onAppointmentPress?.(appointment.id)}
                activeOpacity={0.7}
              >
                <View style={styles.appointmentHeader}>
                  <Text style={styles.appointmentDate}>{appointment.date}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.text} />
                </View>
                <Text style={styles.appointmentTime}>{appointment.time}</Text>
                <Text style={styles.appointmentInfo}>{appointment.patientName}</Text>
                <Text style={styles.appointmentWeek}>{appointment.weekInfo}</Text>
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
});
