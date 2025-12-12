import { TouchableOpacity, View, StyleSheet, Text } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, font, sizes } from "../shared/designSystem";
import { useRouter } from "expo-router";

interface ChatHeaderProps {
  title: string;

  // If the 'calling icons' attribute is enabled, then also pass in the onPress functions for the icons
  showCallingIcons?: boolean;
  onCallPress?: (isVideo: boolean) => void;
}

const ChatHeader = (props: ChatHeaderProps) => {
  const router = useRouter();
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <MaterialCommunityIcons name="chevron-left" size={32} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerText}>{props.title}</Text>
      {/* Empty View to balance the center title */}
      {/*<View style={{ width: 32 }} />*/}
      {props.showCallingIcons && (
        <View style={styles.callingIconsContainer}>
          <TouchableOpacity style={styles.callingIcons} onPress={() => props.onCallPress?.(false)}>
            <Ionicons name="call-outline" size={17} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.callingIcons} onPress={() => props.onCallPress?.(true)}>
            <Ionicons name="videocam-outline" size={17} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: sizes.xs,
  },
  headerText: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },
  callingIconsContainer: {
    flexDirection: "row",
    gap: 5,
    justifyContent: "space-between",
  },
  callingIcons: {
    borderRadius: sizes.xxl,
    backgroundColor: colors.inputFieldBackground,
    padding: sizes.s,
  },
});

export default ChatHeader;
