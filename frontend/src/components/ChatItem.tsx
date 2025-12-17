import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { colors, sizes, font } from "../shared/designSystem";

interface ChatItemProps {
  id: string;
  doctorName: string;
  lastMessage: string;
  unreadCount?: number;
  avatarUrl: string | null;
  onPress?: () => void;
}

export default function ChatItem({ doctorName, lastMessage, unreadCount = 0, avatarUrl, onPress }: ChatItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <Image source={{ uri: avatarUrl || "" }} style={styles.avatar} />

      <View style={styles.contentContainer}>
        <Text style={styles.doctorName}>{doctorName}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>

      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: sizes.m,
    paddingHorizontal: sizes.l,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.lightGray,
  },
  contentContainer: {
    flex: 1,
    marginLeft: sizes.m,
    justifyContent: "center",
  },
  doctorName: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: font.xs,
    color: colors.tabIcon,
    fontWeight: "400",
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  badgeText: {
    color: colors.white,
    fontSize: font.xxs,
    fontWeight: "700",
  },
});
