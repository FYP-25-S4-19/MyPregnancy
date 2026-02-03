import { useAppointmentsForMonthQuery } from "@/src/shared/hooks/useAppointments";
import { homeHorizontalScrollStyle } from "@/src/shared/globalStyles";
import { Text, TouchableOpacity, View } from "react-native";
import AppointmentCard from "../cards/AppointmentCard";
import { sizes, shadows, colors } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import { FC } from "react";

interface ConsultationSectionProps {
  onFindDoctorPressed?: () => void;
  isGuest?: boolean;
}

const ConsultationSection: FC<ConsultationSectionProps> = ({ onFindDoctorPressed, isGuest = false }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = !!accessToken;

  const { data: appointments } = useAppointmentsForMonthQuery(isAuthenticated);

  return (
    <View style={homeHorizontalScrollStyle.section}>
      {/* Header outside the cards */}
      <View style={homeHorizontalScrollStyle.sectionHeader}>
        <Text style={homeHorizontalScrollStyle.sectionTitle}>Upcoming Consultation</Text>
        {onFindDoctorPressed && (
          <TouchableOpacity onPress={onFindDoctorPressed}>
            <Text style={homeHorizontalScrollStyle.viewAllText}>Find a doctor</Text>
          </TouchableOpacity>
        )}
      </View>

      {!appointments || appointments.length === 0 ? (
        isGuest ? (
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "white",
              borderRadius: sizes.s,
              padding: sizes.s,
              paddingLeft: sizes.xl,
              marginHorizontal: sizes.m,
              alignItems: "center",
              justifyContent: "flex-start",
              minHeight: 60,
              ...shadows.small,
            }}
          >
            <Text
              style={{
                fontSize: sizes.m * 1.1,
                fontWeight: "700",
                color: colors.text,
              }}
            >
              No Upcoming Consultation
            </Text>
          </View>
        ) : (
          <View>
            <Text style={homeHorizontalScrollStyle.emptyText}>No Upcoming Consultation</Text>
          </View>
        )
      ) : (
        appointments.map((item) => (
          <AppointmentCard
            key={item.appointment_id}
            data={{
              appointment_id: item.appointment_id,
              date_time: item.date_time,
              doctor_fname: item.doctor_fname,
              status: item.status,
            }}
            viewStyle={{ marginHorizontal: sizes.m }}
          />
        ))
      )}
    </View>
  );
};

export default ConsultationSection;
