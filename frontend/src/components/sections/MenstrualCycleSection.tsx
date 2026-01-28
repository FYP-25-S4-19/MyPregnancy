import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { loadMenstrualSettings, MenstrualSettings } from "@/src/shared/menstrualStorage";
import { getMenstrualSnapshot } from "@/src/shared/menstrualTracker";

type Props = {
  onOpen: () => void;
};

export default function MenstrualCycleSection({ onOpen }: Props) {
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
        <Text style={styles.title}>Menstrual Cycle</Text>
        <Text style={styles.link}>Open</Text>
      </View>

      {!settings?.lastPeriodStartISO || !snapshot ? (
        <>
          <Text style={styles.subtitle}>Set your last period start date to begin tracking.</Text>

          <View style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Set up menstrual tracking</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Cycle day</Text>
              <Text style={styles.metricValue}>Day {snapshot.cycleDay}</Text>
            </View>

            <View style={styles.metricBox}>
              <Text style={styles.metricLabel}>Next period</Text>
              <Text style={styles.metricValue}>
                {snapshot.daysUntilNextPeriod >= 0
                  ? `In ${snapshot.daysUntilNextPeriod} day(s)`
                  : `${Math.abs(snapshot.daysUntilNextPeriod)} day(s) late`}
              </Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${snapshot.cycleProgressPct}%` }]} />
          </View>
          <Text style={styles.smallNote}>Next predicted start: {snapshot.nextPeriodStartISO}</Text>
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
  ctaBtn: {
    marginTop: sizes.m,
    borderWidth: 1.5,
    borderColor: colors.text,
    borderRadius: sizes.s,
    paddingVertical: sizes.s,
    alignItems: "center",
    backgroundColor: "#FFEEF0",
  },
  ctaText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "800",
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
    fontSize: font.m,
    color: colors.text,
    fontWeight: "800",
  },
  progressBar: {
    marginTop: sizes.m,
    height: 18,
    backgroundColor: colors.white,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.text,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFB3BA",
  },
  smallNote: {
    marginTop: sizes.xs,
    fontSize: font.xs,
    color: colors.text,
    opacity: 0.9,
  },
});