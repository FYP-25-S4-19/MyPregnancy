import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useAppointmentsForMonthQuery } from "../shared/hooks/useAppointments";
import AppointmentCard from "../components/cards/AppointmentCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, sizes, font } from "../shared/designSystem";
import { Calendar, DateData } from "react-native-calendars";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";

interface MarkedDateCustomStyles {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
  selectedTextColor?: string;
}

// const APPOINTMENTS: AppointmentData[] = [
//   {
//     id: "1",
//     dateString: "2025-11-01",
//     time: "11:00AM",
//     doctor: "Dr. John",
//     status: "Rejected",
//   },
//   {
//     id: "2",
//     dateString: "2025-11-04",
//     time: "11:00AM",
//     doctor: "Dr. John",
//     status: "Accepted",
//   },
//   {
//     id: "3",
//     dateString: "2025-11-08",
//     time: "09:30AM",
//     doctor: "Dr. Sarah",
//     status: "Pending",
//   },
// ];

const StatusLegend: React.FC = () => (
  <View style={styles.legendContainer}>
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: colors.success }]} />
      <Text style={styles.legendText}>Accepted</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: colors.fail }]} />
      <Text style={styles.legendText}>Rejected</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: colors.warning }]} />
      <Text style={styles.legendText}>Pending</Text>
    </View>
  </View>
);

export default function AppointmentScreen() {
  const [selectedDate, setSelectedDate] = useState<string>("2025-11-04");

  const { data: appointments, isLoading, isFetching, isRefetching, isError } = useAppointmentsForMonthQuery();

  if (isLoading || isFetching || isRefetching) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.text }}>Loading appointments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment</Text>
          <View style={{ width: 28 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.text }}>Error loading appointments. Please try again later.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getMarkedDates = (): Record<string, MarkedDateCustomStyles> => {
    const marks: Record<string, MarkedDateCustomStyles> = {};

    appointments.forEach((appt) => {
      let dotColor = colors.warning;
      if (appt.status === "ACCEPTED") dotColor = colors.success;
      if (appt.status === "REJECTED") dotColor = colors.fail;

      marks[appt.date_time] = {
        marked: true,
        dotColor: dotColor,
      };
    });

    const existingMark = marks[selectedDate] || {};

    marks[selectedDate] = {
      ...existingMark,
      selected: true,
      selectedColor: colors.primary,
      selectedTextColor: colors.white,
    };

    return marks;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarHeaderContainer}>
          <Text style={styles.monthText}>{new Date().toLocaleString("en-US", { month: "long" })}</Text>
          <Text style={styles.yearText}>{new Date().getFullYear()}</Text>
        </View>

        <Calendar
          current={"2025-11-01"}
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          markedDates={getMarkedDates()}
          renderHeader={() => null}
          hideArrows={true}
          theme={{
            calendarBackground: "transparent",
            textSectionTitleColor: colors.text,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: colors.white,
            todayTextColor: colors.primary,
            dayTextColor: colors.text,
            textDisabledColor: colors.lightGray,
            dotColor: colors.primary,
            selectedDotColor: colors.white,
            arrowColor: colors.text,
            monthTextColor: colors.text,
            textDayFontWeight: "400",
            textDayHeaderFontWeight: "bold",
            textDayFontSize: font.s,
            textDayHeaderFontSize: font.s,
          }}
        />

        <StatusLegend />

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Consultation Request</Text>
          {appointments.map((appt) => (
            <AppointmentCard key={appt.appointment_id} data={appt} />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  legendContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: sizes.s,
    paddingLeft: sizes.s,
    gap: sizes.l,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: font.xs,
    color: colors.text,
  },

  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: sizes.m,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
  },
  headerTitle: {
    fontSize: font.l,
    fontWeight: "bold",
    color: colors.text,
  },
  backButton: {
    padding: sizes.xs,
  },
  calendarHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: sizes.m,
    marginBottom: sizes.s,
    paddingHorizontal: sizes.xs,
  },
  monthText: {
    fontSize: font.xl,
    color: colors.text,
    fontWeight: "400",
  },
  yearText: {
    fontSize: font.xl,
    color: colors.primary,
    fontWeight: "bold",
  },
  sectionContainer: {
    marginTop: sizes.xl,
  },
  sectionTitle: {
    fontSize: font.l,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.m,
  },
});
