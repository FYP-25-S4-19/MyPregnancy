import React, { useState, useEffect } from "react";
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import useAuthStore from "@/src/shared/authStore";
import api from "@/src/shared/api";
import { colors, font, shadows, sizes } from "@/src/shared/designSystem";
import { getRiskColor, getRiskMessage, predictRisk, RiskPredictionResponse } from "@/src/shared/riskService";
import { SafeAreaView } from "react-native-safe-area-context";
import { useJournalWindow } from "@/src/shared/hooks/useJournalWindow";
import { useUpsertJournalEntry, SCALAR_METRIC_IDS } from "@/src/shared/hooks/useJournalMetrics";

const Icon = ({ name, size, color }: { name: string; size: number; color: string }) => {
  let symbol = "?";
  if (name === "chevron-left") symbol = "‹";
  if (name === "chevron-right") symbol = "›";
  if (name === "home") symbol = "🏠";
  if (name === "book-open-variant") symbol = "📖";
  if (name === "calendar-month") symbol = "📅";
  if (name === "account") symbol = "👤";

  return <Text style={{ fontSize: size, color }}>{symbol}</Text>;
};

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

interface VitalInputProps {
  label: string;
  unit: string;
  isDoubleInput?: boolean; // For Blood Pressure
}

// --- COMPONENTS ---

const Chip: React.FC<ChipProps> = ({ label, selected, onPress }) => {
  return (
    <TouchableOpacity style={[styles.chip, selected ? styles.chipSelected : styles.chipUnselected]} onPress={onPress}>
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
};

// --- DATE UTILS ---
function formatDate(date: Date) {
  // Returns "Today, 14 October 2025" or "Monday, 13 October 2025"
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", weekday: "long" };
  const formatted = date.toLocaleDateString(undefined, options);
  return isToday
    ? `Today, ${date.getDate()} ${date.toLocaleString("default", { month: "long" })} ${date.getFullYear()}`
    : formatted;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dateKey(date: Date) {
  // "YYYY-MM-DD"
  return date.toISOString().slice(0, 10);
}

// 2. Vitals Row Component
const VitalRow: React.FC<VitalInputProps & { value: string | [string, string]; onChange: (v: any) => void }> = ({
  label,
  unit,
  isDoubleInput,
  value,
  onChange,
}) => (
  <View style={styles.vitalRow}>
    <Text style={styles.vitalLabel}>{label}</Text>
    <View style={styles.vitalInputContainer}>
      {isDoubleInput ? (
        <>
          <TextInput
            style={styles.vitalInputSmall}
            keyboardType="numeric"
            value={Array.isArray(value) ? value[0] : ""}
            onChangeText={(t) => onChange([t, Array.isArray(value) ? value[1] : ""])}
          />
          <Text style={styles.slashText}>/</Text>
          <TextInput
            style={styles.vitalInputSmall}
            keyboardType="numeric"
            value={Array.isArray(value) ? value[1] : ""}
            onChangeText={(t) => onChange([Array.isArray(value) ? value[0] : "", t])}
          />
        </>
      ) : (
        <TextInput
          style={styles.vitalInput}
          keyboardType="numeric"
          value={typeof value === "string" ? value : ""}
          onChangeText={onChange}
        />
      )}
      {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
    </View>
  </View>
);

export default function App() {
  // --- DATE STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"Journal" | "Kicks">("Journal");
  const [isLoadingRisk, setIsLoadingRisk] = useState(false);
  const [riskResult, setRiskResult] = useState<RiskPredictionResponse | null>(null);

  // Kicks counter state
  const [isKicksRunning, setIsKicksRunning] = useState(false);
  const [kickStartTime, setKickStartTime] = useState<Date | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [kickCount, setKickCount] = useState(0);
  const [kickSessionId, setKickSessionId] = useState<number | null>(null);
  const [pastKickCounts, setPastKickCounts] = useState<Array<{ date: string; kick_count: number }>>([]);
  const [isLoadingKickCounts, setIsLoadingKickCounts] = useState(false);
  const [isRecordingKick, setIsRecordingKick] = useState(false);
  const [isStartingKickSession, setIsStartingKickSession] = useState(false);
  const [isStoppingKickSession, setIsStoppingKickSession] = useState(false);
  const timerRef = React.useRef<number | null>(null);

  // Format elapsed seconds into mm:ss
  const formatElapsed = (s: number) => {
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const fetchPastKickCounts = async (): Promise<void> => {
    try {
      setIsLoadingKickCounts(true);
      const res = await api.get<{ days: Array<{ date: string; kick_count: number }> }>("/kick-tracker/counts");
      setPastKickCounts(res.data.days || []);
    } catch (e) {
      console.error("Failed to fetch kick counts:", e);
    } finally {
      setIsLoadingKickCounts(false);
    }
  };

  const startKicks = async (): Promise<void> => {
    if (isKicksRunning || isStartingKickSession) return;
    try {
      setIsStartingKickSession(true);
      const res = await api.post<{ session_id: number }>("/kick-tracker/sessions/start");
      setKickSessionId(res.data.session_id);

      setIsKicksRunning(true);
      setKickStartTime(new Date());
      timerRef.current = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000) as unknown as number;
    } catch (e) {
      Alert.alert("Error", "Failed to start kick session");
      console.error("Start kick session error:", e);
    } finally {
      setIsStartingKickSession(false);
    }
  };

  const stopKicks = async (): Promise<void> => {
    setIsKicksRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current as unknown as number);
      timerRef.current = null;
    }

    if (kickSessionId == null || isStoppingKickSession) return;
    try {
      setIsStoppingKickSession(true);
      await api.post("/kick-tracker/sessions/stop");
      setKickSessionId(null);
      await fetchPastKickCounts();
    } catch (e) {
      console.error("Stop kick session error:", e);
      // Best-effort: local UI has already stopped.
      setKickSessionId(null);
    } finally {
      setIsStoppingKickSession(false);
    }
  };

  const resetKicks = (): void => {
    void stopKicks();
    setElapsedSec(0);
    setKickCount(0);
    setKickStartTime(null);
  };

  const recordKick = async (): Promise<void> => {
    if (!isKicksRunning || isRecordingKick) return;
    try {
      setIsRecordingKick(true);
      const res = await api.post<{ session_kick_count: number }>("/kick-tracker/kicks", {});
      setKickCount(res.data.session_kick_count);
      await fetchPastKickCounts();
    } catch (e) {
      Alert.alert("Error", "Failed to record kick");
      console.error("Record kick error:", e);
    } finally {
      setIsRecordingKick(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Kicks") {
      void fetchPastKickCounts();
    }
  }, [activeTab]);

  // ensure timer cleared on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current as unknown as number);
    };
  }, []);
  // get the authenticated user object (store exposes `me`)
  const user = useAuthStore((s) => s.me);

  // --- JOURNAL DATA with dynamic metrics from backend ---
  const {
    currentDate: journalDate,
    navigateToDate,
    currentEntry,
    isLoading: isLoadingJournal,
    getBinaryMetricsByCategory,
  } = useJournalWindow(currentDate);

  // Local state for editing before save
  const [localContent, setLocalContent] = useState("");
  const [selectedMetricIds, setSelectedMetricIds] = useState<Set<number>>(new Set());
  const [localVitals, setLocalVitals] = useState({
    bloodPressure: ["", ""] as [string, string],
    sugar: "",
    heartRate: "",
    weight: "",
  });

  // Mutation for saving journal entry
  const upsertMutation = useUpsertJournalEntry();

  // Sync local state when currentEntry changes
  useEffect(() => {
    if (currentEntry) {
      setLocalContent(currentEntry.content);

      // Extract selected metric IDs
      const selectedIds = new Set<number>();
      currentEntry.binary_metrics.forEach((categoryGroup) => {
        categoryGroup.binary_metric_logs.forEach((metric) => {
          if (metric.is_selected) {
            selectedIds.add(metric.metric_id);
          }
        });
      });
      setSelectedMetricIds(selectedIds);

      // Set vitals
      setLocalVitals({
        bloodPressure: [
          currentEntry.blood_pressure.systolic?.toString() || "",
          currentEntry.blood_pressure.diastolic?.toString() || "",
        ],
        sugar: currentEntry.scalar_metrics.find((m) => m.label.toLowerCase().includes("sugar"))?.value.toString() || "",
        heartRate:
          currentEntry.scalar_metrics.find((m) => m.label.toLowerCase().includes("heart"))?.value.toString() || "",
        weight:
          currentEntry.scalar_metrics.find((m) => m.label.toLowerCase().includes("weight"))?.value.toString() || "",
      });
    } else {
      // No entry exists for this date - reset to defaults
      setLocalContent("");
      setSelectedMetricIds(new Set());
      setLocalVitals({
        bloodPressure: ["", ""],
        sugar: "",
        heartRate: "",
        weight: "",
      });
    }
  }, [currentEntry]);

  const handleDateChange = (direction: "prev" | "next") => {
    const newDate = addDays(currentDate, direction === "next" ? 1 : -1);
    setCurrentDate(newDate);
    navigateToDate(newDate);
  };

  const handleFeelingChange = (text: string) => {
    setLocalContent(text);
  };

  const toggleMetricSelection = (metricId: number) => {
    setSelectedMetricIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(metricId)) {
        newSet.delete(metricId);
      } else {
        newSet.add(metricId);
      }
      return newSet;
    });
  };

  const handleVitalChange = (field: string, value: string | [string, string]) => {
    setLocalVitals((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save journal entry
  const handleSaveJournal = async () => {
    try {
      const dateStr = dateKey(currentDate);

      // Prepare scalar metrics using IDs from backend or fallback
      const scalarMetrics = [];

      // Get metric IDs from current entry's scalar metrics or use fallback
      const sugarMetricId =
        currentEntry?.scalar_metrics.find((m) => m.label.toLowerCase().includes("sugar"))?.metric_id ||
        SCALAR_METRIC_IDS.SUGAR;
      const heartRateMetricId =
        currentEntry?.scalar_metrics.find((m) => m.label.toLowerCase().includes("heart"))?.metric_id ||
        SCALAR_METRIC_IDS.HEART_RATE;
      const weightMetricId =
        currentEntry?.scalar_metrics.find((m) => m.label.toLowerCase().includes("weight"))?.metric_id ||
        SCALAR_METRIC_IDS.WEIGHT;

      if (localVitals.sugar) {
        scalarMetrics.push({ metric_id: sugarMetricId, value: parseFloat(localVitals.sugar) });
      }
      if (localVitals.heartRate) {
        scalarMetrics.push({ metric_id: heartRateMetricId, value: parseFloat(localVitals.heartRate) });
      }
      if (localVitals.weight) {
        scalarMetrics.push({ metric_id: weightMetricId, value: parseFloat(localVitals.weight) });
      }

      await upsertMutation.mutateAsync({
        entryDate: dateStr,
        data: {
          content: localContent,
          binary_metric_ids: Array.from(selectedMetricIds),
          scalar_metrics: scalarMetrics.length > 0 ? scalarMetrics : undefined,
          blood_pressure:
            localVitals.bloodPressure[0] && localVitals.bloodPressure[1]
              ? {
                  systolic: parseInt(localVitals.bloodPressure[0]),
                  diastolic: parseInt(localVitals.bloodPressure[1]),
                }
              : undefined,
        },
      });

      Alert.alert("Success", "Journal entry saved!");
    } catch (error) {
      Alert.alert("Error", "Failed to save journal entry");
      console.error("Save journal error:", error);
    }
  };

  // Note: use `isLoadingRisk` and `handleAssessRisk` for all risk checks

  // --- RISK ASSESSMENT ---
  const handleAssessRisk = async () => {
    const { bloodPressure, sugar, heartRate } = localVitals;

    // Validate inputs
    if (!bloodPressure[0] || !bloodPressure[1] || !sugar || !heartRate) {
      Alert.alert("Missing Data", "Please fill in all vital signs (Blood Pressure, Blood Sugar, Heart Rate)");
      return;
    }

    // Get user age from auth store (or use default if not available)
    const userAge = user?.age || 28;

    try {
      setIsLoadingRisk(true);
      // Parse and validate numeric inputs
      const systolic = Number.parseFloat(bloodPressure[0]);
      const diastolic = Number.parseFloat(bloodPressure[1]);
      const bsVal = Number.parseFloat(sugar);
      const hr = Number.parseFloat(heartRate);

      const badField =
        !Number.isFinite(systolic) ||
        !Number.isFinite(diastolic) ||
        !Number.isFinite(bsVal) ||
        !Number.isFinite(hr) ||
        !Number.isFinite(userAge as number);

      if (badField) {
        Alert.alert("Invalid input", "Please enter valid numeric values for your vitals.");
        return;
      }

      // Basic range checks (match backend validators)
      if (
        userAge <= 0 ||
        userAge > 150 ||
        systolic < 0 ||
        systolic > 300 ||
        diastolic < 0 ||
        diastolic > 300 ||
        bsVal < 0 ||
        bsVal > 50 ||
        hr <= 0 ||
        hr > 250
      ) {
        Alert.alert("Invalid range", "One or more inputs are out of expected ranges. Please check and try again.");
        return;
      }

      const result = await predictRisk({
        age: userAge,
        systolic_bp: systolic,
        diastolic_bp: diastolic,
        bs: bsVal,
        heart_rate: hr,
      });
      // Normalize checks: treat new `risk_level` as source of truth when `is_high_risk` is absent
      setRiskResult(result);
      const isHigh = result.is_high_risk ?? result.risk_level === "high";
      if (isHigh) {
        Alert.alert("⚠️ High Risk Alert", getRiskMessage(result), [{ text: "OK" }]);
      }
    } catch (error: any) {
      console.error("Risk assessment failed:", error);
      // If the server returned validation error details, show them
      const serverMsg = error?.response?.data?.detail || error?.response?.data || error?.message;
      if (error?.response?.status === 422 && serverMsg) {
        // FastAPI usually returns an array of validation errors; stringify for display
        const friendly = typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg);
        Alert.alert("Assessment Failed", `Validation error from server: ${friendly}`);
      } else if (serverMsg) {
        Alert.alert("Assessment Failed", String(serverMsg));
      } else {
        Alert.alert("Assessment Failed", "Could not assess risk. Please try again.");
      }
    } finally {
      setIsLoadingRisk(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      {/* --- HEADER SECTION --- */}
      <View style={[styles.headerContainer, activeTab === "Kicks" && styles.headerContainerKicks]}>
        {/* Toggle Switch */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === "Journal" && styles.toggleBtnActive]}
            onPress={() => setActiveTab("Journal")}
          >
            <Text style={[styles.toggleText, activeTab === "Journal" && styles.toggleTextActive]}>Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === "Kicks" && styles.toggleBtnActive]}
            onPress={() => setActiveTab("Kicks")}
          >
            <Text style={[styles.toggleText, activeTab === "Kicks" && styles.toggleTextActive]}>Kicks Counter</Text>
          </TouchableOpacity>
        </View>
        {/* Date Navigator (Journal only) */}
        {activeTab === "Journal" ? (
          <View style={styles.dateRow}>
            <TouchableOpacity onPress={() => handleDateChange("prev")}>
              <Icon name="chevron-left" size={30} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
            <TouchableOpacity onPress={() => handleDateChange("next")}>
              <Icon name="chevron-right" size={30} color={colors.text} />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {activeTab === "Journal" ? (
          <>
            {/* --- CARD 1: FEELING --- */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>How are you feeling?</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Type here.."
                placeholderTextColor={colors.secondary}
                multiline
                value={localContent}
                onChangeText={handleFeelingChange}
              />
            </View>

            {/* --- DYNAMIC BINARY METRIC CATEGORIES --- */}
            {isLoadingJournal ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Loading metrics...</Text>
              </View>
            ) : Object.keys(getBinaryMetricsByCategory()).length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>No metrics available</Text>
                <Text style={{ color: colors.secondary }}>Unable to load journal metrics. Please try refreshing.</Text>
              </View>
            ) : (
              Object.entries(getBinaryMetricsByCategory()).map(([category, metrics]) => (
                <View key={category} style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {category.charAt(0) + category.slice(1).toLowerCase().replace(/_/g, " ")}
                  </Text>
                  <View style={styles.chipContainer}>
                    {metrics.map((metric) => (
                      <Chip
                        key={metric.metric_id}
                        label={metric.label}
                        selected={selectedMetricIds.has(metric.metric_id)}
                        onPress={() => toggleMetricSelection(metric.metric_id)}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
            {/* --- CARD 3: VITALS --- */}
            <View style={styles.card}>
              <VitalRow
                label="Blood Pressure"
                unit=""
                isDoubleInput
                value={localVitals.bloodPressure}
                onChange={(v: [string, string]) => handleVitalChange("bloodPressure", v)}
              />
              <VitalRow
                label="Sugar Level"
                unit="mmol/L"
                value={localVitals.sugar}
                onChange={(v: string) => handleVitalChange("sugar", v)}
              />
              <VitalRow
                label="Heart Rate"
                unit="bpm"
                value={localVitals.heartRate}
                onChange={(v: string) => handleVitalChange("heartRate", v)}
              />
              <VitalRow
                label="Weight"
                unit="kg"
                value={localVitals.weight}
                onChange={(v: string) => handleVitalChange("weight", v)}
              />
              <View style={{ marginTop: sizes.s }}>
                <TouchableOpacity
                  style={[styles.saveButton, { marginBottom: sizes.xs }]}
                  onPress={handleSaveJournal}
                  disabled={upsertMutation.isPending}
                >
                  <Text style={styles.saveButtonText}>{upsertMutation.isPending ? "Saving..." : "Save Journal"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAssessRisk} disabled={isLoadingRisk}>
                  <Text style={styles.saveButtonText}>{isLoadingRisk ? "Checking..." : "Check Risk"}</Text>
                </TouchableOpacity>
                {riskResult ? (
                  // Make 'mid' risk visually prominent
                  <View
                    style={[
                      styles.riskCard,
                      (riskResult.risk_level ?? (riskResult.is_high_risk ? "high" : "low")) === "mid"
                        ? styles.riskCardMid
                        : { borderColor: getRiskColor(riskResult) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cardTitle,
                        (riskResult.risk_level ?? (riskResult.is_high_risk ? "high" : "low")) === "mid"
                          ? styles.midTitle
                          : {},
                      ]}
                    >
                      {(riskResult.risk_level ?? (riskResult.is_high_risk ? "high" : "low")) === "mid"
                        ? "⚠️ MID RISK"
                        : "Risk Assessment"}
                    </Text>
                    <Text
                      style={
                        (riskResult.risk_level ?? (riskResult.is_high_risk ? "high" : "low")) === "mid"
                          ? styles.midMessage
                          : { marginBottom: sizes.s }
                      }
                    >
                      {riskResult.message}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </>
        ) : null}

        {/* --- Kicks Counter Tab --- */}
        {activeTab === "Kicks" ? (
          <View style={styles.kicksContainer}>
            <Text style={styles.kicksInstruction}>Tap the icon when your baby kicks!</Text>
            <Text style={styles.kicksLabel}>Start Time</Text>
            <Text style={styles.kicksTimer}>{formatElapsed(elapsedSec)}</Text>

            <TouchableOpacity style={styles.kicksCircle} onPress={recordKick} activeOpacity={0.8}>
              <Text style={styles.kicksIcon}>👣</Text>
            </TouchableOpacity>

            <View style={styles.kickControls}>
              <TouchableOpacity
                style={[styles.kickBtn, isKicksRunning && styles.kickBtnActive]}
                onPress={isKicksRunning ? stopKicks : startKicks}
              >
                <Text style={styles.kickBtnText}>{isKicksRunning ? "Stop" : "Start"}</Text>
              </TouchableOpacity>

              <View style={styles.kickCountBox}>
                <Text style={styles.kickCountText}>{kickCount}</Text>
                <Text style={styles.kickCountLabel}>kicks</Text>
              </View>

              <TouchableOpacity style={styles.kickBtn} onPress={resetKicks}>
                <Text style={styles.kickBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>

              <View style={styles.kickHistoryBox}>
                <Text style={styles.kickHistoryTitle}>Past 14 days</Text>
                {isLoadingKickCounts ? (
                  <Text style={styles.kickHistoryItem}>Loading...</Text>
                ) : pastKickCounts.length === 0 ? (
                  <Text style={styles.kickHistoryItem}>No kick history yet</Text>
                ) : (
                  pastKickCounts.map((d) => (
                    <View key={d.date} style={styles.kickHistoryRow}>
                      <Text style={styles.kickHistoryDate}>{d.date}</Text>
                      <Text style={styles.kickHistoryCount}>{d.kick_count}</Text>
                    </View>
                  ))
                )}
              </View>
          </View>
        ) : (
          <View style={{ height: 80 }} />
        )}

        {/* Spacer for bottom tab */}
        <View style={{ height: 80 }} />
      </ScrollView>
      {/* --- BOTTOM TAB BAR --- */}
      {/*<View style={styles.bottomBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Icon name="home" size={sizes.icon} color={colors.primary} />
          <Text style={[styles.tabLabel, { color: colors.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Icon name="book-open-variant" size={sizes.icon} color={colors.tabIcon} />
          <Text style={styles.tabLabel}>Recipe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Icon name="calendar-month" size={sizes.icon} color={colors.tabIcon} />
          <Text style={styles.tabLabel}>Appointment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Icon name="account" size={sizes.icon} color={colors.tabIcon} />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>*/}
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerContainer: {
    alignItems: "center",
    paddingVertical: sizes.s + sizes.xs,
    backgroundColor: colors.white,
  },
  headerContainerKicks: {
    paddingVertical: sizes.s,
  },
  // Toggle Switch Styles
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 25,
    padding: sizes.xs / 2,
    marginBottom: sizes.m - sizes.s,
  },
  toggleBtn: {
    paddingVertical: sizes.s,
    paddingHorizontal: 25,
    borderRadius: sizes.m + sizes.xs,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: font.s,
  },
  toggleTextActive: {
    color: colors.white,
  },
  // Date Row
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%",
  },
  dateText: {
    fontSize: font.m - 2,
    fontWeight: "bold",
    color: colors.text,
  },
  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: sizes.m,
    paddingTop: sizes.s + sizes.xs,
  },
  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.m - sizes.s,
    padding: sizes.m - sizes.s,
    marginBottom: sizes.m - sizes.s,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.inputFieldBackground,
  },
  cardTitle: {
    fontSize: font.m - 2,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.s + sizes.xs,
  },
  // Input Area
  textArea: {
    height: 100,
    textAlignVertical: "top", // Android fix
    color: colors.text,
    fontSize: font.s,
    borderWidth: 1,
    borderColor: colors.inputFieldBackground,
    borderRadius: sizes.s + sizes.xs,
    padding: sizes.s + sizes.xs,
  },
  // Chips
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    paddingVertical: sizes.s - 2,
    paddingHorizontal: sizes.m - sizes.xs,
    borderRadius: sizes.m,
    marginRight: sizes.s,
    marginBottom: sizes.s,
    borderWidth: 1,
  },
  chipUnselected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipSelected: {
    backgroundColor: colors.secondary, // Keep background pinkish
    borderColor: colors.text, // Dark border to indicate selection like image
    borderWidth: 1.5,
  },
  chipText: {
    color: colors.text,
    fontWeight: "500",
  },
  // Vitals
  vitalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: sizes.m - sizes.xs,
  },
  vitalLabel: {
    fontSize: font.s,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
  },
  vitalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  vitalInput: {
    width: 60,
    height: 35,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: sizes.s - 3,
    textAlign: "center",
    color: colors.text,
    marginRight: sizes.s,
  },
  vitalInputSmall: {
    width: 50,
    height: 35,
    borderWidth: 1,
    borderColor: colors.text,
    borderRadius: sizes.s - 3,
    textAlign: "center",
    color: colors.text,
  },
  slashText: {
    fontSize: font.m,
    color: colors.text,
    marginHorizontal: sizes.s - 3,
  },
  unitText: {
    color: colors.tabIcon,
    width: 50,
  },
  // Risk Assessment
  assessButton: {
    backgroundColor: colors.primary,
    paddingVertical: sizes.m - sizes.xs,
    paddingHorizontal: sizes.m,
    borderRadius: sizes.m - sizes.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  assessButtonDisabled: {
    opacity: 0.6,
  },
  assessButtonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: font.m - 2,
  },
  riskCardHigh: {
    backgroundColor: "#ffe6e6",
    borderColor: "#e74c3c",
    borderWidth: 1.5,
  },
  riskCardLow: {
    backgroundColor: "#e6ffe6",
    borderColor: "#2ecc71",
    borderWidth: 1.5,
  },
  riskTitle: {
    fontSize: font.m - 1,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: sizes.s,
  },
  riskMessage: {
    fontSize: font.s,
    color: colors.text,
    marginBottom: sizes.s + sizes.xs,
    lineHeight: 20,
  },
  // Mid risk prominent styling
  riskCardMid: {
    marginTop: sizes.s,
    padding: sizes.s,
    borderRadius: sizes.s,
    borderWidth: 1.5,
    backgroundColor: "#fff7e6",
    borderColor: "#f39c12",
  },
  midTitle: {
    color: "#f39c12",
    fontWeight: "bold",
  },
  midMessage: {
    marginBottom: sizes.s,
    fontWeight: "700",
    color: "#7a4f00",
  },
  riskDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  riskDetail: {
    fontSize: font.xs,
    color: colors.tabIcon,
    fontWeight: "500",
  },
  // Bottom Bar
  bottomBar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingVertical: sizes.s + sizes.xs,
    borderTopWidth: 1,
    borderTopColor: colors.inputFieldBackground,
    justifyContent: "space-around",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    alignItems: "center",
  },
  tabLabel: {
    fontSize: font.xxs,
    marginTop: sizes.xs,
    color: colors.tabIcon,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.m,
    borderRadius: sizes.s,
    alignItems: "center",
    marginBottom: sizes.s,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
  riskCard: {
    marginTop: sizes.s,
    padding: sizes.s,
    borderRadius: sizes.s,
    borderWidth: 1.5,
    backgroundColor: colors.white,
  },
  // Kicks counter styles
  kicksContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: sizes.m,
  },
  kicksInstruction: {
    color: colors.text,
    marginBottom: sizes.xs,
    fontSize: font.m - 2,
    fontWeight: "600",
  },
  kicksLabel: {
    color: colors.text,
    marginTop: sizes.s,
    fontSize: font.m - 2,
    fontWeight: "600",
  },
  kicksTimer: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.primary,
    marginVertical: sizes.s,
  },
  kicksTimerLarge: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    marginVertical: sizes.s,
  },
  kicksCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 8,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: sizes.m,
  },
  kicksCircleLarge: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 10,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: sizes.m,
    backgroundColor: colors.white,
  },
  kicksIcon: {
    fontSize: 100,
  
  },
  kicksIconLarge: {
    fontSize: 64,
    color: colors.primary,
  },
  kickControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "80%",
    marginTop: sizes.s,
  },
  kickControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "70%",
    marginTop: sizes.s,
  },
  // Kicks buttons (was missing; added to fix runtime error)
  kickBtn: {
    backgroundColor: colors.primary,
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.m,
    borderRadius: sizes.s,
    alignItems: "center",
    justifyContent: "center",
  },
  kickBtnActive: {
    // When kicks session is running, show a distinct STOP state
    backgroundColor: "#D32F2F",
  },
  kickBtnText: {
    color: colors.white,
    fontWeight: "700",
  },
  controlCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  controlCircleIdle: {
    backgroundColor: "#ffdfe0",
  },
  controlCircleActive: {
    backgroundColor: colors.primary,
  },
  controlIcon: {
    fontSize: 20,
    color: colors.white,
    fontWeight: "700",
  },
  centerCountCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  centerCountText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
  },
  kickCountBox: {
    alignItems: "center",
  },
  kickCountText: {
    fontSize: font.xl,
    fontWeight: "800",
    color: colors.primary,
  },
  kickCountLabel: {
    fontSize: font.xs,
    color: colors.tabIcon,
  },
  viewPast: {
    color: colors.text,
    marginTop: sizes.s,
    fontSize: font.m - 2,
    fontWeight: "600",
  },
  kickHistoryBox: {
    marginTop: sizes.m,
    width: "90%",
    backgroundColor: colors.white,
    borderRadius: sizes.s,
    padding: sizes.s,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  kickHistoryTitle: {
    color: colors.text,
    fontSize: font.m - 2,
    fontWeight: "700",
    marginBottom: sizes.s,
  },
  kickHistoryItem: {
    color: colors.tabIcon,
    fontSize: font.xs,
  },
  kickHistoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: sizes.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputFieldBackground,
  },
  kickHistoryDate: {
    color: colors.text,
    fontSize: font.xs,
  },
  kickHistoryCount: {
    color: colors.primary,
    fontSize: font.s,
    fontWeight: "800",
  },
});
