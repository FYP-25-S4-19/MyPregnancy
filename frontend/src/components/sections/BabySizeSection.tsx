import { Text, View, StyleSheet } from "react-native";
import { colors, font, sizes } from "@/src/shared/designSystem";

const pregnancyData = {
  week: 24,
  totalWeeks: 40,
  babySize: {
    comparison: "corn",
    length: 30,
    weight: 600,
  },
};

export default function BabySizeSection() {
  const getProgressPercentage = (): number => {
    return Math.round((pregnancyData.week / pregnancyData.totalWeeks) * 100);
  };

  return (
    <>
      {/* Baby Size Card */}
      <View style={styles.babySizeCard}>
        <View style={styles.babyCircle}>
          <Text style={styles.cornEmoji}>🌽</Text>
          <Text style={styles.weekText}>Week {pregnancyData.week}</Text>
        </View>

        <View style={styles.babySizeInfo}>
          <Text style={styles.babySizeTitle}>Your baby is now</Text>
          <Text style={styles.babySizeSubtitle}>as big as a {pregnancyData.babySize.comparison}.</Text>
          <View style={styles.measurements}>
            <Text style={styles.measurementText}>Approx:</Text>
            <Text style={styles.measurementText}>length: {pregnancyData.babySize.length} cm</Text>
            <Text style={styles.measurementText}>weight: {pregnancyData.babySize.weight} g</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
        </View>
        <Text style={styles.weekProgress}>
          Week {pregnancyData.week}/{pregnancyData.totalWeeks}
        </Text>
      </View>

      <Text style={styles.progressLabel}>{getProgressPercentage()}% of your pregnancy journey!</Text>
    </>
  );
}

const styles = StyleSheet.create({
  babySizeCard: {
    flexDirection: "row",
    marginHorizontal: sizes.m,
    paddingVertical: sizes.l,
    paddingHorizontal: sizes.m,
    borderRadius: sizes.m,
    alignItems: "center",
    gap: sizes.m,
    marginBottom: sizes.m,
  },
  babyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFEEF0",
    borderWidth: 3,
    borderColor: colors.text,
    justifyContent: "center",
    alignItems: "center",
  },
  cornEmoji: {
    fontSize: 60,
    marginBottom: sizes.s,
  },
  weekText: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.text,
  },
  babySizeInfo: {
    flex: 1,
  },
  babySizeTitle: {
    fontSize: font.m,
    color: colors.text,
    fontWeight: "500",
  },
  babySizeSubtitle: {
    fontSize: font.m,
    color: colors.text,
    fontWeight: "500",
    marginBottom: sizes.s,
  },
  measurements: {
    marginTop: sizes.xs,
  },
  measurementText: {
    fontSize: font.xs,
    color: colors.text,
    lineHeight: 20,
  },
  progressContainer: {
    marginHorizontal: sizes.m,
    marginBottom: sizes.xs,
    position: "relative",
  },
  progressBar: {
    height: 32,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFB3BA",
  },
  weekProgress: {
    position: "absolute",
    right: sizes.m,
    top: 0,
    bottom: 0,
    fontSize: font.xs,
    color: colors.text,
    fontWeight: "500",
    textAlignVertical: "center",
    lineHeight: 32,
  },
  progressLabel: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "600",
    marginLeft: sizes.m,
    marginBottom: sizes.m,
  },
});
