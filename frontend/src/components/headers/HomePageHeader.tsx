import { Text, TouchableOpacity, View, StyleSheet, Image } from "react-native";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";

interface HomePageHeaderProps {
  greetingText?: string;
  headerText: string;
  profilePicURL?: string;
  profilePicStrFallback?: string;
  onNotificationPress?: () => void;
}

/**
 * Simple - If there is a profilePicURL, show the image.
 *          If not, show the 'profilePicStrFallback' inside a colored circle.
 *
 * You'd probably want the 'profilePicStrFallback' to be initials or something similar
 */
const HomePageHeader: FC<HomePageHeaderProps> = ({
  greetingText,
  headerText,
  profilePicURL = null,
  profilePicStrFallback,
  onNotificationPress,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.avatar}>
          {profilePicURL ? (
            <Image source={{ uri: profilePicURL }} style={{ width: 60, height: 60, borderRadius: 30 }} />
          ) : (
            profilePicStrFallback && <Text style={styles.avatarText}>{profilePicStrFallback}</Text>
          )}
        </View>
        <View>
          <Text style={styles.greetingText}>{greetingText || "Hi, Welcome back,"}</Text>
          <Text style={styles.userName}>{headerText}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onNotificationPress ?? onNotificationPress} style={styles.notificationButton}>
        <View style={styles.notificationDot} />
        <Ionicons name="notifications-outline" size={28} />
      </TouchableOpacity>
    </View>
  );
};

export default HomePageHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: sizes.m,
    paddingTop: sizes.xl,
    paddingBottom: sizes.l,

    backgroundColor: colors.white,
    marginBottom: sizes.m,

    borderBottomLeftRadius: sizes.xl,
    borderBottomRightRadius: sizes.xl,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.m,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFB3BA",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.white,
  },
  greetingText: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.6,
  },
  userName: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
  },
  notificationButton: {
    position: "relative",
    padding: sizes.s,
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fail,
    zIndex: 1,
  },
});
