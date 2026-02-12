import { Text, TouchableOpacity, View, StyleSheet, ActivityIndicator, Image } from "react-native";
import { useUnreadNotifications } from "@/src/shared/hooks/useNotifications";
import { useGetProfileImgUrl } from "@/src/shared/hooks/useProfile";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";

interface HomePageHeaderProps {
  greetingText?: string;
  headerText: string;
  profilePicStrFallback?: string;
  onNotificationPress?: () => void;
  isGuest?: boolean;
}

/**
 * Simple - If there is a profilePicURL (fetched internally), show the image.
 *          If not, show the 'profilePicStrFallback' inside a colored circle.
 *
 * You'd probably want the 'profilePicStrFallback' to be initials or something similar
 */
const HomePageHeader: FC<HomePageHeaderProps> = ({
  greetingText,
  headerText,
  profilePicStrFallback,
  onNotificationPress,
  isGuest = false,
}) => {
  const { data: profileImageUrl, isLoading: isLoadingProfileImage } = useGetProfileImgUrl(!isGuest);
  const { data: hasUnreadNotifications } = useUnreadNotifications(!isGuest);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.avatar}>
          {isLoadingProfileImage ? (
            <ActivityIndicator size="small" color={colors.secondary} />
          ) : profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
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
        {hasUnreadNotifications && <View style={styles.notificationDot} />}
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
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
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
