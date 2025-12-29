import {
  ActivityIndicator,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Channel as ChannelElement, MessageInput, MessageList, useChatContext } from "stream-chat-expo";
import ConsultationMessageFooter from "@/src/components/ConsultationMessageFooter";
import { useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import ConsultRequestChip from "@/src/components/ConsultRequestChip";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatHeader from "@/src/components/headers/ChatHeader";
import { colors, sizes, font } from "@/src/shared/designSystem";
import { Calendar, DateData } from "react-native-calendars";
import { router, useLocalSearchParams } from "expo-router";
import useAuthStore from "@/src/shared/authStore";
import React, { useState, useMemo } from "react";
import utils from "@/src/shared/utils";
import uuid from "react-native-uuid";
import api from "@/src/shared/api";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const AVAILABILITY_CONFIG = {
  START_HOUR: 8, // 8am
  END_HOUR: 17, // 5pm (17:00)
  SLOT_DURATION_MINUTES: 45,
};

interface TimeSlot {
  time: string; // "10:00 AM"
  datetime: Date;
}

export default function IndividualChatScreen() {
  const me = useAuthStore((state) => state.me);
  const { cid } = useLocalSearchParams();
  const { client } = useChatContext();
  const [channelType, channelID] = (cid as string)?.split(":") || [null, null];
  const streamVideoClient = useStreamVideoClient();

  // Modal state
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [isBooking, setIsBooking] = useState<boolean>(false);

  // Generate available time slots for selected date
  const availableTimeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate) return [];

    const slots: TimeSlot[] = [];
    const date = new Date(selectedDate);

    for (
      let hour = AVAILABILITY_CONFIG.START_HOUR;
      hour < AVAILABILITY_CONFIG.END_HOUR;
      hour += AVAILABILITY_CONFIG.SLOT_DURATION_MINUTES / 60
    ) {
      const slotDate = new Date(date);
      const hourPart = Math.floor(hour);
      const minutePart = (hour % 1) * 60;

      slotDate.setHours(hourPart, minutePart, 0, 0);

      // Format time as "10:00 AM"
      const timeString = slotDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      slots.push({
        time: timeString,
        datetime: slotDate,
      });
    }

    return slots;
  }, [selectedDate]);

  // Get marked dates for calendar (only allow future dates)
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: colors.primary,
        selectedTextColor: colors.white,
      };
    }

    return marks;
  }, [selectedDate]);

  if (!me || !client || !channelType || !channelID || !client.user?.id) {
    return (
      <View style={styles.loadingContainer}>
        {!me && <Text>{"'Me' is null"}</Text>}
        {!client && <Text>Client is invalid</Text>}
        {!channelType && <Text>ChannelType is invalid</Text>}
        {!channelID && <Text>ChannelID is invalid</Text>}
        {!client.user?.id && <Text>UserID is invalid</Text>}
        <ActivityIndicator />
      </View>
    );
  }

  const channel = client.channel(channelType, channelID);
  const otherMember = utils.getOtherMemberInChannel(channel, client.user.id.toString());
  if (otherMember === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Other member not found</Text>
      </View>
    );
  }
  const otherFirstname = otherMember.name?.split(" ")[0] || "Missing name wthelly";

  const isDoctor = me.role === "VOLUNTEER_DOCTOR";

  // Handle opening modal
  const handleOpenBookingModal = (): void => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    setSelectedDate(tomorrowStr);
    setSelectedTimeSlot(null);
    setShowBookingModal(true);
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!selectedTimeSlot || !otherMember.id) return;

    setIsBooking(true);
    try {
      const res = await api.post("/appointments/", {
        doctor_id: otherMember.id,
        start_time: selectedTimeSlot.datetime.toISOString(),
      });

      await channel.sendMessage({
        text: `
Request sent to Dr. ${otherFirstname}.
[${utils.formatConsultRequestDate(selectedTimeSlot.datetime)}]
You'll be notified when they respond.
        `,
        consultData: {
          appointmentID: res.data.appointment_id,
          status: "pending",
        },
      });

      setShowBookingModal(false);
      setSelectedTimeSlot(null);
    } catch (err) {
      console.error("Error booking appointment:", err);
      alert("Failed to book appointment. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  // Only doctors can initiate calls
  const callPressHandler = isDoctor
    ? async (isVideo: boolean): Promise<void> => {
        if (!streamVideoClient?.state.connectedUser?.id || !otherMember.id) {
          return;
        }

        const call = streamVideoClient.call("default", uuid.v4(), { reuseInstance: false });
        await call.getOrCreate({
          ring: true,
          video: isVideo,
          data: {
            members: [{ user_id: streamVideoClient.state.connectedUser.id }, { user_id: otherMember.id }],
          },
        });
      }
    : undefined;

  const headerHeight = 50;
  const titlePrefix = isDoctor ? "" : "Dr. ";

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1 }}>
      <ChatHeader
        title={`${titlePrefix}${otherFirstname}`}
        showCallingIcons={isDoctor}
        onCallPress={callPressHandler}
        headerHeight={headerHeight}
      />

      <ChannelElement channel={channel} MessageFooter={isDoctor ? ConsultationMessageFooter : undefined}>
        <MessageList />

        <KeyboardAvoidingView keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}>
          <View style={[styles.inputWrapper, { marginBottom: headerHeight * 1.2 }]}>
            {/* Only mothers can request consultations */}
            {!isDoctor && <ConsultRequestChip onPress={handleOpenBookingModal} />}
            <MessageInput
              additionalTextInputProps={{
                style: {
                  borderWidth: 0,
                  outlineWidth: 0,
                },
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </ChannelElement>

      {/* Appointment Booking Modal */}
      <Modal visible={showBookingModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBookingModal(false)} style={styles.closeButton}>
              {/*<Text style={styles.closeButtonText}>Cancel</Text>*/}
              <MaterialCommunityIcons name="chevron-left" size={32} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Dr. {otherFirstname}</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
            {/* Month/Year Header */}
            <View style={styles.calendarHeaderContainer}>
              <Text style={styles.monthText}>
                {selectedDate
                  ? new Date(selectedDate).toLocaleString("en-US", { month: "long" })
                  : new Date().toLocaleString("en-US", { month: "long" })}
              </Text>
              <Text style={styles.yearText}>
                {selectedDate ? new Date(selectedDate).getFullYear() : new Date().getFullYear()}
              </Text>
            </View>

            {/* Calendar */}
            <Calendar
              current={selectedDate || undefined}
              onDayPress={(day: DateData) => {
                setSelectedDate(day.dateString);
                setSelectedTimeSlot(null); // Reset time slot when date changes
              }}
              markedDates={markedDates}
              renderHeader={() => null}
              hideArrows={false}
              minDate={new Date().toISOString().split("T")[0]} // Only allow future dates
              theme={{
                calendarBackground: "transparent",
                textSectionTitleColor: colors.text,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.white,
                todayTextColor: colors.primary,
                dayTextColor: colors.text,
                textDisabledColor: colors.lightGray,
                arrowColor: colors.primary,
                monthTextColor: colors.text,
                textDayFontWeight: "400",
                textDayHeaderFontWeight: "bold",
                textDayFontSize: font.s,
                textDayHeaderFontSize: font.s,
              }}
            />

            {/* Available Time Slots */}
            {selectedDate && (
              <View style={styles.timeSlotsSection}>
                <Text style={styles.sectionTitle}>Available Time Slot</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeSlotsContainer}
                >
                  {availableTimeSlots.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.timeSlotButton,
                        selectedTimeSlot?.time === slot.time && styles.timeSlotButtonSelected,
                      ]}
                      onPress={() => setSelectedTimeSlot(slot)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedTimeSlot?.time === slot.time && styles.timeSlotTextSelected,
                        ]}
                      >
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Confirm Button */}
            {selectedTimeSlot && !isBooking && (
              <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-end" }}>
                <TouchableOpacity
                  style={[styles.confirmButton, isBooking && styles.confirmButtonDisabled]}
                  onPress={handleConfirmBooking}
                  disabled={isBooking}
                  activeOpacity={0.8}
                >
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  inputWrapper: {
    paddingBottom: sizes.xxl,
    backgroundColor: colors.white,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  closeButton: {
    padding: sizes.xs,
    width: 60,
  },
  closeButtonText: {
    fontSize: font.s,
    color: colors.primary,
  },
  modalTitle: {
    fontSize: font.l,
    fontWeight: "bold",
    color: colors.primary,
  },
  modalScrollContent: {
    paddingHorizontal: sizes.m,
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
  timeSlotsSection: {
    marginTop: sizes.xl,
  },
  sectionTitle: {
    fontSize: font.l,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.m,
  },
  timeSlotsContainer: {
    paddingVertical: sizes.s,
    gap: sizes.m,
  },
  timeSlotButton: {
    backgroundColor: colors.inputFieldBackground,
    paddingVertical: sizes.m,
    paddingHorizontal: sizes.l,
    borderRadius: sizes.s,
    minWidth: 100,
    alignItems: "center",
  },
  timeSlotButtonSelected: {
    backgroundColor: colors.primary,
  },
  timeSlotText: {
    fontSize: font.m,
    color: colors.text,
    fontWeight: "400",
  },
  timeSlotTextSelected: {
    color: colors.white,
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: colors.veryLightPink,
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.l,
    borderRadius: sizes.s,
    alignItems: "center",

    marginTop: sizes.m,
    marginRight: sizes.s,

    alignSelf: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "500",
  },
});
