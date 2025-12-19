import { FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAppointmentsForMonthQuery } from "@/src/shared/hooks/useAppointments";
import { homeHorizontalScrollStyle } from "@/src/shared/globalStyles";
import { FC } from "react";
import AppointmentCard from "../cards/AppointmentCard";
import { sizes } from "@/src/shared/designSystem";

interface ConsultationSectionProps {
  onFindDoctorPressed?: () => void;
}

const ConsultationSection: FC<ConsultationSectionProps> = ({ onFindDoctorPressed }) => {
  const { data: appointments } = useAppointmentsForMonthQuery();

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
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.appointment_id}
          renderItem={({ item }) => {
            return (
              <AppointmentCard
                data={{
                  appointment_id: item.appointment_id,
                  date_time: item.date_time,
                  doctor_fname: item.doctor_fname,
                  status: item.status,
                }}
                viewStyle={{ marginHorizontal: sizes.m }}
              />
            );
          }}
        />
      )}
    </View>
  );
};

export default ConsultationSection;
