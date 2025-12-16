import { colors, font, shadows, sizes } from "../shared/designSystem";
import { Text, View, StyleSheet } from "react-native";

type AppointmentStatus = "Accepted" | "Rejected" | "Pending";

export interface AppointmentData {
  id: string;
  dateString: string;
  time: string;
  doctor: string;
  status: AppointmentStatus;
}

export interface AppointmentCardProps {
  item: AppointmentData;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ item }) => {
  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case "Accepted":
        return colors.success;
      case "Rejected":
        return colors.fail;
      case "Pending":
        return colors.warning;
      default:
        return colors.text;
    }
  };

  const formattedDate = new Date(item.dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.cardTitle}>
        {formattedDate} {item.time}
      </Text>

      <View style={styles.cardRow}>
        <View style={styles.dash} />
        <Text style={styles.cardDetail}>with {item.doctor}</Text>
      </View>

      <View style={styles.cardRow}>
        <View style={[styles.dash, { backgroundColor: getStatusColor(item.status) }]} />
        <Text style={[styles.cardStatus, { color: getStatusColor(item.status) }]}>{item.status}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius,
    padding: sizes.m,
    marginBottom: sizes.m,
    borderWidth: 1,
    borderColor: colors.inputFieldBackground,
    ...shadows.small,
  },
  cardTitle: {
    fontSize: font.m,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.xs,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  dash: {
    width: 20,
    height: 1,
    backgroundColor: colors.text,
    marginRight: sizes.s,
  },
  cardDetail: {
    fontSize: font.s,
    color: colors.text,
  },
  cardStatus: {
    fontSize: font.s,
    fontWeight: "600",
  },
});

export default AppointmentCard;
