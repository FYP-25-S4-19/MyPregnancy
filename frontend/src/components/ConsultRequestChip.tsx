import { TouchableOpacity, StyleSheet, Text } from "react-native";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { Channel as ChannelType } from "stream-chat";

interface ConsultRequestChipProps {
  channel: ChannelType;
  onPress?: () => void;
}

const ConsultRequestChip = ({ channel, onPress }: ConsultRequestChipProps) => {
  return (
    <TouchableOpacity style={styles.consultationChip} onPress={onPress}>
      <Text style={styles.consultationText}>Request Consultation</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  consultationChip: {
    backgroundColor: colors.secondary,
    alignSelf: "flex-start",
    paddingVertical: sizes.xs,
    paddingHorizontal: sizes.m,
    borderRadius: sizes.m,
    marginBottom: sizes.xs,
    marginLeft: sizes.xs,
  },
  consultationText: {
    color: colors.text,
    fontSize: font.xs,
    fontWeight: "600",
  },
});

export default ConsultRequestChip;
