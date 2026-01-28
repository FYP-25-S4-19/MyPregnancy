import { useAppointmentsForMonthQuery } from "@/src/shared/hooks/useAppointments";
import { homeHorizontalScrollStyle } from "@/src/shared/globalStyles";
import { Text, TouchableOpacity, View } from "react-native";
import AppointmentCard from "../cards/AppointmentCard";
import { sizes } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import { FC } from "react";

interface ConsultationSectionProps {
  onFindDoctorPressed?: () => void;
}

const ConsultationSection: FC<ConsultationSectionProps> = ({ onFindDoctorPressed }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = !!accessToken;

  const { data: appointments } = useAppointmentsForMonthQuery(isAuthenticated);

  return (
    <View style={homeHorizontalScrollStyle.section}>
      {/* Header outside the cards */}
      <View style={homeHorizontalScrollStyle.sectionHeader}>
        <Text style={homeHorizontalScrollStyle.sectionTitle}>Consultation</Text>
        {onFindDoctorPressed && (
          <TouchableOpacity onPress={onFindDoctorPressed}>
            <Text style={homeHorizontalScrollStyle.viewAllText}>Find a doctor</Text>
          </TouchableOpacity>
        )}
      </View>

      {!appointments || appointments.length === 0 ? (
        <View>
          <Text style={homeHorizontalScrollStyle.emptyText}>No appointments scheduled.</Text>
        </View>
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
