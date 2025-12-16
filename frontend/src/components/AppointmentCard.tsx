import { AppointmentPreviewData, AppointmentStatus } from "../shared/typesAndInterfaces";
import { colors, font, shadows, sizes } from "../shared/designSystem";
import { Text, View, StyleSheet } from "react-native";

export interface AppointmentCardProps {
  data: AppointmentPreviewData;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ data }) => {
  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case "ACCEPTED":
        return colors.success;
      case "REJECTED":
        return colors.fail;
      case "PENDING_ACCEPT_REJECT":
        return colors.warning;
      default:
        return colors.text;
    }
  };

  const formattedDate = new Date(data.date_time).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.cardTitle}>
        {formattedDate} {data.date_time.slice(11, 16)}
      </Text>

      <View style={styles.cardRow}>
        <View style={styles.dash} />
        <Text style={styles.cardDetail}>with Dr. {data.doctor_fname}</Text>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.dash} />
        <Text style={[styles.cardStatus, { color: getStatusColor(data.status) }]}>
          {((): string => {
            if (data.status === "ACCEPTED") return "Accepted";
            if (data.status === "REJECTED") return "Rejected";
            if (data.status === "PENDING_ACCEPT_REJECT") return "Pending";
            return "ERROR: Check the 'status' returned from the appointment data";
          })()}
        </Text>
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
