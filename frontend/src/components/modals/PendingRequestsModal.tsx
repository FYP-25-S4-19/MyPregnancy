import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, sizes, font } from "@/src/shared/designSystem";
import { formatAppointmentDate, formatAppointmentTime, getWeekNumber } from "@/src/shared/hooks/useAppointments";

export interface PendingAppointment {
  appointment_id: string;
  doctor_id: string;
  doctor_name: string;
  mother_id: string;
  mother_name: string;
  start_time: string;
  status: string;
}

interface PendingRequestsModalProps {
  visible: boolean;
  appointments: PendingAppointment[];
  isLoading?: boolean;
  onClose: () => void;
  onAppointmentPress: (appointmentId: string) => void;
  isNavigating?: boolean;
}

export default function PendingRequestsModal({
  visible,
  appointments,
  isLoading = false,
  onClose,
  onAppointmentPress,
  isNavigating = false,
}: PendingRequestsModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* 1. Backdrop overlay: Closes modal when tapping outside */}
        <Pressable style={styles.overlay} onPress={onClose} />

        {/* 2. Modal Body: Changed to View to avoid touch conflicts */}
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Pending Request</Text>
            <View style={styles.badge}>
              <Text style={styles.headerCount}>{appointments.length}</Text>
            </View>
          </View>

          {/* 3. Content Area: Wrapped in a flexible View */}
          <View style={styles.mainArea}>
            {isLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading requests...</Text>
              </View>
            ) : appointments.length === 0 ? (
              <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="inbox-outline" size={64} color={colors.lightGray} />
                <Text style={styles.emptyText}>No pending requests</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollContent}
                contentContainerStyle={styles.scrollContentContainer}
                showsVerticalScrollIndicator={true}
              >
                {appointments.map((appointment) => (
                  <TouchableOpacity
                    key={appointment.appointment_id}
                    style={styles.requestCard}
                    onPress={() => onAppointmentPress(appointment.appointment_id)}
                    disabled={isNavigating}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.dateTimeContainer}>
                        <Text style={styles.dateText}>{formatAppointmentDate(appointment.start_time)}</Text>
                        <Text style={styles.timeText}>{formatAppointmentTime(appointment.start_time)}</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
                    </View>

                    <Text style={styles.motherName}>
                      {appointment.mother_name} • {getWeekNumber(appointment.start_time)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Slightly darker for focus
    justifyContent: "center",
    alignItems: "center",
    padding: sizes.l,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: "#FFE9EC",
    borderRadius: sizes.l,
    width: "95%",
    maxWidth: 500,
    maxHeight: "80%", // Increased slightly for better view
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: sizes.l,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  headerTitle: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
  },
  badge: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingHorizontal: sizes.s,
    paddingVertical: sizes.xs / 2,
    borderRadius: sizes.s,
  },
  headerCount: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
  },
  mainArea: {
    flexShrink: 1, // Crucial: Allows the container to shrink to fit items or grow to maxHeight
  },
  centerContainer: {
    paddingVertical: sizes.xxl,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    // We don't use flex: 1 here so it only takes needed space
  },
  scrollContentContainer: {
    padding: sizes.l,
    gap: sizes.m,
  },
  requestCard: {
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.l,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: sizes.s,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.xs / 2,
  },
  timeText: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.text,
  },
  motherName: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.6,
    fontWeight: "500",
  },
  footer: {
    padding: sizes.l,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "flex-end",
  },
  cancelButton: {
    backgroundColor: colors.white,
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.xl,
    borderRadius: sizes.s,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  cancelButtonText: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.text,
  },
  loadingText: {
    marginTop: sizes.m,
    color: colors.text,
    fontSize: font.m,
  },
  emptyText: {
    fontSize: font.m,
    color: colors.text,
    marginTop: sizes.m,
    opacity: 0.6,
  },
});
