// frontend/src/app/main/(notab)/planning/index.tsx

import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { loadMenstrualSettings } from "@/src/shared/menstrualStorage";
import { useEffect, useMemo, useState } from "react";
import { getMenstrualSnapshot } from "@/src/shared/menstrualTracker";

export default function PlanningTrackerScreen() {
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [lastPeriodStartISO, setLastPeriodStartISO] = useState<string | null>(null);
  const [cycleLengthDays, setCycleLengthDays] = useState<number>(28);
  const [periodLengthDays, setPeriodLengthDays] = useState<number>(5);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await loadMenstrualSettings();
      if (!mounted) return;
      setLastPeriodStartISO(s?.lastPeriodStartISO ?? null);
      setCycleLengthDays(s?.cycleLengthDays ?? 28);
      setPeriodLengthDays(s?.periodLengthDays ?? 5);
      setSettingsLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const snapshot = useMemo(() => {
    if (!lastPeriodStartISO) return null;
    return getMenstrualSnapshot({
      lastPeriodStartISO,
      cycleLengthDays,
      periodLengthDays,
    });
  }, [lastPeriodStartISO, cycleLengthDays, periodLengthDays]);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Planning Tracker</Text>
          <Text style={styles.subtitle}>Fertile window and ovulation are estimates.</Text>
        </View>

        {!settingsLoaded ? (
          <View style={styles.card}>
            <Text style={styles.cardText}>Loading…</Text>
          </View>
        ) : !snapshot ? (
          <View style={styles.card}>
            <Text style={styles.cardText}>
              Please set your last period start date in Menstrual Tracker first.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.big}>{snapshot.insight}</Text>
              <Text style={styles.small}>Phase: {snapshot.phaseLabel}</Text>
              <Text style={styles.small}>
                Cycle day: {snapshot.cycleDay}/{snapshot.cycleLengthDays}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.big}>Ovulation (estimate)</Text>
              <Text style={styles.value}>{snapshot.ovulationISO}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.big}>Fertile window</Text>
              <Text style={styles.value}>
                {snapshot.fertileStartISO} → {snapshot.fertileEndISO}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.big}>Next predicted period</Text>
              <Text style={styles.value}>{snapshot.nextPeriodStartISO}</Text>
            </View>
          </>
        )}

        <View style={{ height: sizes.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },
  header: {
    paddingHorizontal: sizes.m,
    paddingTop: sizes.s,
    paddingBottom: sizes.m,
  },
  title: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    marginTop: sizes.xs,
    fontSize: font.s,
    color: colors.text,
    opacity: 0.9,
  },
  card: {
    marginHorizontal: sizes.m,
    marginBottom: sizes.m,
    padding: sizes.m,
    borderRadius: sizes.m,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  cardText: {
    fontSize: font.s,
    color: colors.text,
    lineHeight: 20,
  },
  big: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
  },
  value: {
    marginTop: sizes.s,
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
    backgroundColor: "#FFEEF0",
    padding: sizes.s,
    borderRadius: sizes.s,
    borderWidth: 1,
    borderColor: colors.text,
  },
  small: {
    marginTop: sizes.xs,
    fontSize: font.s,
    color: colors.text,
  },
});