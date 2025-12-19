import { AppointmentPreviewData, AppointmentStatus } from "../../shared/typesAndInterfaces";
import { colors, font, shadows, sizes } from "../../shared/designSystem";
import { Text, View, StyleSheet, ViewStyle } from "react-native";

export interface AppointmentCardProps {
  data: AppointmentPreviewData;
  viewStyle?: ViewStyle;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ data, viewStyle }) => {
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

  const parseDate = () => {
    const date = new Date(data.date_time);
    const day = date.getDate();
    const month = date.toLocaleString("en-GB", { month: "long" });

    const hours24 = date.getHours();
    const hours12 = hours24 % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const period = hours24 >= 12 ? "pm" : "am";

    return { formattedDate: `${day} ${month}`, time: `${hours12}:${minutes}${period}` };
  };

  const { formattedDate, time } = parseDate();

  return (
    <View style={[styles.cardContainer, viewStyle]}>
      <Text style={styles.cardTitle}>
        {formattedDate} {time}
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
