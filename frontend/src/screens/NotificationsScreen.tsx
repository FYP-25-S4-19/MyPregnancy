import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from "react-native";
import { colors, font, sizes } from "../shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { FC } from "react";

interface NotificationEntryProps {
  isRead: boolean;
  sentAt: Date;
  content: string;
  onPress: () => void;
}

export const NotificationEntry: FC<NotificationEntryProps> = ({ isRead, sentAt, content, onPress }) => {
  const entryBgColor = isRead ? colors.white : colors.secondary;

  return (
    <TouchableOpacity onPress={onPress} style={[notifEntryStyles.container, { backgroundColor: entryBgColor }]}>
      <Text style={notifEntryStyles.timeText}>Today, 7:30am</Text>
      <Text style={notifEntryStyles.contentText}>{content}</Text>
    </TouchableOpacity>
  );
};

const notifEntryStyles = StyleSheet.create({
  container: {
    padding: sizes.m,
  },
  timeText: {
    color: colors.text,
    marginBottom: sizes.xs,
    fontSize: font.xs,
    fontWeight: "300",
  },
  contentText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "600",
  },
});
//============================================================
const NotificationScreen: FC = () => {
  return (
    <View style={notifScreenStyles.container}>
      <View style={notifScreenStyles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={notifScreenStyles.headerText}>Notifications</Text>
        {/* Invisible placeholder for alignment */}
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={notifScreenStyles.scrollView}>
        <NotificationEntry
          isRead={true}
          sentAt={new Date()}
          content="Hi Mama! Don't forget to take your prenatal vitamins today!"
          onPress={() => {}}
        />
        <NotificationEntry
          isRead={true}
          sentAt={new Date()}
          content="Hi Mama! Don't forget to take your prenatal vitamins today!"
          onPress={() => {}}
        />
        <NotificationEntry
          isRead={false}
          sentAt={new Date()}
          content="Hi Mama! Don't forget to take your prenatal vitamins today!"
          onPress={() => {}}
        />
        <NotificationEntry
          isRead={true}
          sentAt={new Date()}
          content="Hi Mama! Don't forget to take your prenatal vitamins today!"
          onPress={() => {}}
        />
        <NotificationEntry
          isRead={false}
          sentAt={new Date()}
          content="Hi Mama! Don't forget to take your prenatal vitamins today!"
          onPress={() => {}}
        />
        <NotificationEntry
          isRead={true}
          sentAt={new Date()}
          content="Hi Mama! Don't forget to take your prenatal vitamins today!"
          onPress={() => {}}
        />
        <NotificationEntry
          isRead={true}
          sentAt={new Date()}
          content="Hi Mama! Don't forget to take your prenatal vitamins today!"
          onPress={() => {}}
        />
        <NotificationEntry
          isRead={false}
          sentAt={new Date()}
          content="Hi Mama! Don't forget to take your prenatal vitamins today!"
          onPress={() => {}}
        />
        <NotificationEntry
          isRead={true}
          sentAt={new Date()}
          content="Hi Mama! Don't forget to take your prenatal vitamins today!"
          onPress={() => {}}
        />
      </ScrollView>
    </View>
  );
};

const notifScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    height: 140,
    padding: sizes.m,
  },
  headerText: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
  },
  scrollView: {
    paddingVertical: sizes.s,
  },
});

export default NotificationScreen;
