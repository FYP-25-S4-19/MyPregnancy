// frontend/src/app/main/(notab)/menstrual/index.tsx

import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { router } from "expo-router";

import { colors, font, sizes } from "@/src/shared/designSystem";
import {
  DEFAULT_MENSTRUAL_SETTINGS,
  loadMenstrualSettings,
  saveMenstrualSettings,
  MenstrualSettings,
} from "@/src/shared/menstrualStorage";
import { getMenstrualSnapshot, toISODate } from "@/src/shared/menstrualTracker";

export default function MenstrualScreen() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<MenstrualSettings>(DEFAULT_MENSTRUAL_SETTINGS);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [lastPeriodStartISO, setLastPeriodStartISO] = useState<string | null>(null);
  const [cycleLengthDays, setCycleLengthDays] = useState<number>(28);
  const [periodLengthDays, setPeriodLengthDays] = useState<number>(5);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const s = await loadMenstrualSettings();
        if (!mounted) return;

        setSettings(s);
        setLastPeriodStartISO(s.lastPeriodStartISO ?? null);
        setCycleLengthDays(s.cycleLengthDays ?? 28);
        setPeriodLengthDays(s.periodLengthDays ?? 5);
      } catch (e: any) {
        console.log("Menstrual load error:", e);
        Alert.alert("Error", "Could not load menstrual settings.");
      } finally {
        if (mounted) setLoading(false);
      }
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

  const openPicker = () => setShowDatePicker(true);

  const onPickDate = (_event: any, selected?: Date) => {
    setShowDatePicker(false);
    if (!selected) return;
    setLastPeriodStartISO(toISODate(selected));
  };

  const save = async () => {
    try {
      await saveMenstrualSettings({
        lastPeriodStartISO,
        cycleLengthDays,
        periodLengthDays,
      });
      Alert.alert("Saved", "Menstrual tracking updated.");
      router.back();
    } catch (e: any) {
      Alert.alert("Save failed", String(e?.message || "Unknown error"));
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.veryLightPink }}>
        <View style={{ padding: sizes.m }}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
            <Text style={styles.backTxt}>‹</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Menstrual Tracker</Text>
            <Text style={styles.subtitle}>Predictions are estimates.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Overview</Text>

          {!snapshot ? (
            <Text style={styles.bodyText}>Set your last period start date to begin tracking.</Text>
          ) : (
            <>
              <View style={styles.row}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Today</Text>
                  <Text style={styles.metricValue}>{snapshot.todayISO}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Cycle day</Text>
                  <Text style={styles.metricValue}>Day {snapshot.cycleDay}</Text>
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Phase</Text>
                  <Text style={styles.metricValue}>{snapshot.phaseLabel}</Text>
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

              <Text style={styles.note}>Next predicted start: {snapshot.nextPeriodStartISO}</Text>
              <Text style={styles.insight}>{snapshot.insight}</Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Settings</Text>

          <Text style={styles.fieldLabel}>Last period start date</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={openPicker} activeOpacity={0.85}>
            <Text style={styles.pickerBtnText}>{lastPeriodStartISO ?? "Select date"}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={lastPeriodStartISO ? new Date(`${lastPeriodStartISO}T00:00:00`) : new Date()}
              mode="date"
              display="calendar"
              onChange={onPickDate}
              accentColor={"#C4555D"}
            />
          )}

          <Text style={[styles.fieldLabel, { marginTop: sizes.m }]}>
            Cycle length (days): <Text style={styles.bold}>{cycleLengthDays}</Text>
          </Text>
          <Slider
            minimumValue={20}
            maximumValue={45}
            step={1}
            value={cycleLengthDays}
            onValueChange={setCycleLengthDays}
            minimumTrackTintColor={"#FFB3BA"}
            maximumTrackTintColor={"#E7C2C6"}
            thumbTintColor={"#C4555D"}
          />

          <Text style={[styles.fieldLabel, { marginTop: sizes.m }]}>
            Period length (days): <Text style={styles.bold}>{periodLengthDays}</Text>
          </Text>
          <Slider
            minimumValue={2}
            maximumValue={10}
            step={1}
            value={periodLengthDays}
            onValueChange={setPeriodLengthDays}
            minimumTrackTintColor={"#FFB3BA"}
            maximumTrackTintColor={"#E7C2C6"}
            thumbTintColor={"#C4555D"}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={save} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: sizes.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.veryLightPink },
  scroll: { flex: 1 },

  header: {
    paddingHorizontal: sizes.m,
    paddingTop: sizes.s,
    paddingBottom: sizes.m,
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.s,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.text,
    backgroundColor: colors.white,
  },
  backTxt: { fontSize: 26, color: colors.text, marginTop: -2 },

  title: { fontSize: font.l, fontWeight: "800", color: colors.text },
  subtitle: { marginTop: 2, fontSize: font.s, color: colors.text, opacity: 0.9 },

  card: {
    marginHorizontal: sizes.m,
    marginBottom: sizes.m,
    backgroundColor: colors.white,
    borderRadius: sizes.m,
    padding: sizes.m,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  cardTitle: { fontSize: font.m, fontWeight: "800", color: colors.text },

  bodyText: { marginTop: sizes.s, fontSize: font.s, color: colors.text, lineHeight: 20 },

  row: { flexDirection: "row", gap: sizes.s, marginTop: sizes.m },
  metricBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: sizes.s,
    padding: sizes.s,
    backgroundColor: "#FFEEF0",
  },
  metricLabel: { fontSize: font.xs, color: colors.text, opacity: 0.9, marginBottom: 2 },
  metricValue: { fontSize: font.m, color: colors.text, fontWeight: "800" },

  progressBar: {
    marginTop: sizes.m,
    height: 18,
    backgroundColor: colors.white,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.text,
  },
  progressFill: { height: "100%", backgroundColor: "#FFB3BA" },

  note: { marginTop: sizes.xs, fontSize: font.xs, color: colors.text, opacity: 0.9 },
  insight: { marginTop: sizes.s, fontSize: font.s, color: colors.text, fontWeight: "600" },

  fieldLabel: { marginTop: sizes.s, fontSize: font.s, color: colors.text, fontWeight: "700" },
  bold: { fontWeight: "900" },

  pickerBtn: {
    marginTop: sizes.xs,
    borderWidth: 1.5,
    borderColor: colors.text,
    borderRadius: sizes.s,
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.m,
    backgroundColor: "#FFEEF0",
  },
  pickerBtnText: { color: colors.text, fontSize: font.m, fontWeight: "700" },

  saveBtn: {
    marginTop: sizes.m,
    borderWidth: 1.5,
    borderColor: colors.text,
    borderRadius: sizes.s,
    paddingVertical: sizes.s,
    alignItems: "center",
    backgroundColor: "#FFB3BA",
  },
  saveBtnText: { color: colors.text, fontSize: font.m, fontWeight: "900" },
});