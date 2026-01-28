import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { loadMenstrualSettings, MenstrualSettings } from "@/src/shared/menstrualStorage";
import { getMenstrualSnapshot } from "@/src/shared/menstrualTracker";

type Props = {
  onOpen: () => void;
};

export default function PrePregnancyPlanningSection({ onOpen }: Props) {
  const [settings, setSettings] = useState<MenstrualSettings | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await loadMenstrualSettings();
      if (mounted) setSettings(s);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const snapshot = useMemo(() => {
    if (!settings?.lastPeriodStartISO) return null;
    return getMenstrualSnapshot({
      lastPeriodStartISO: settings.lastPeriodStartISO,
      cycleLengthDays: settings.cycleLengthDays,
      periodLengthDays: settings.periodLengthDays,
    });
  }, [settings]);

  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} activeOpacity={0.85}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Planning Tracker</Text>
        <Text style={styles.link}>Open</Text>
      </View>

      {!settings?.lastPeriodStartISO || !snapshot ? (
        <Text style={styles.subtitle}>
          Set your last period start date to calculate fertile window and ovulation.
        </Text>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Ovulation</Text>
              <Text style={styles.metricValue}>{snapshot.ovulationISO}</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Fertile window</Text>
              <Text style={styles.metricValueSmall}>
                {snapshot.fertileStartISO} → {snapshot.fertileEndISO}
              </Text>
            </View>
          </View>

          <Text style={styles.smallNote}>{snapshot.insight}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: sizes.m,
    padding: sizes.m,
    borderRadius: sizes.m,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.text,
    marginBottom: sizes.m,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: font.m,
    fontWeight: "800",
    color: colors.text,
  },
  link: {
    fontSize: font.s,
    fontWeight: "700",
    color: colors.text,
    textDecorationLine: "underline",
  },
  subtitle: {
    marginTop: sizes.s,
    fontSize: font.s,
    color: colors.text,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    gap: sizes.s,
    marginTop: sizes.m,
  },
  metricBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: sizes.s,
    padding: sizes.s,
    backgroundColor: "#FFEEF0",
  },
  metricLabel: {
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.9,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "800",
  },
  metricValueSmall: {
    fontSize: font.xs,
    color: colors.text,
    fontWeight: "800",
    lineHeight: 18,
  },
  smallNote: {
    marginTop: sizes.s,
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.9,
    fontWeight: "700",
  },
});