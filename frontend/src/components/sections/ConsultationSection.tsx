import { FlatList, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAppointmentsForMonthQuery } from "@/src/shared/hooks/useAppointments";
import { homeHorizontalScrollStyle } from "@/src/shared/globalStyles";
import { FC } from "react";

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

      {/* Horizontal scrolling cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={homeHorizontalScrollStyle.scrollContent}
      >
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
                <TouchableOpacity>
                  <View>Appointment ID: {item.appointment_id}</View>
                  <View>Doctor FName: {item.doctor_fname}</View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default ConsultationSection;
