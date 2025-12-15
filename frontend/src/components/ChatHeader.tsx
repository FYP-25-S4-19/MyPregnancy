import { TouchableOpacity, View, StyleSheet, Text } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, font, sizes } from "../shared/designSystem";
import { router } from "expo-router";

interface ChatHeaderProps {
  title: string;
  headerHeight: number;

  // If the 'calling icons' attribute is enabled, then also pass in the onPress functions for the icons
  showCallingIcons?: boolean;
  onCallPress?: (isVideo: boolean) => void;
}

const ChatHeader = (props: ChatHeaderProps) => {
  return (
    <View style={[styles.headerContainer, { height: props.headerHeight }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <MaterialCommunityIcons name="chevron-left" size={32} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text style={styles.headerText}>{props.title}</Text>
      </View>
      {/* Empty View to balance the center title */}
      {props.showCallingIcons ? (
        <View style={styles.callingIconsContainer}>
          <TouchableOpacity style={styles.callingIcons} onPress={() => props.onCallPress?.(false)}>
            <Ionicons name="call-outline" size={17} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.callingIcons} onPress={() => props.onCallPress?.(true)}>
            <Ionicons name="videocam-outline" size={17} color={colors.text} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.callingIconsContainer} />
      )}
    </View>
  );
};

const LEFT_AND_RIGHT_CONTAINER_WIDTH = 73;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.m,
    // paddingTop: sizes.m,
    // paddingBottom: sizes.s,
    backgroundColor: colors.white,
  },
  backButton: {
    width: LEFT_AND_RIGHT_CONTAINER_WIDTH,
    padding: sizes.xs,
  },
  headerText: {
    fontSize: font.m * 1.125,
    fontWeight: "700",
    color: colors.primary,
    textAlign: "center",
  },
  callingIconsContainer: {
    width: LEFT_AND_RIGHT_CONTAINER_WIDTH,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 7,
  },
  callingIcons: {
    borderRadius: sizes.xxl,
    backgroundColor: colors.inputFieldBackground,
    padding: sizes.s,
  },
});

export default ChatHeader;
