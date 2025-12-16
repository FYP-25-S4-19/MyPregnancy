import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, StatusBar } from "react-native";
import React, { useState } from "react";

import { colors, sizes, font, shadows } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";

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

  // --- JOURNAL DATA STATE ---
  type JournalData = {
    feeling: string;
    moods: string[];
    symptoms: string[];
    vitals: {
      bloodPressure: [string, string];
      sugar: string;
      heartRate: string;
      weight: string;
    };
  };
  const moods = ["Calm", "Happy", "Energetic", "Sad", "Anxious", "Low Energy", "Depressed", "Confused", "Irritated"];
  const symptoms = ["Everything is fine", "Cramps", "Tender breasts", "Headache", "Cravings", "Insomnia"];

  // Store all data by date
  const [journals, setJournals] = useState<{ [date: string]: JournalData }>({});

  // Ensure journal exists for current date infinitely rendering
  const currentKey = dateKey(currentDate);
  React.useEffect(() => {
    if (!journals[currentKey]) {
      setJournals((prev) => ({
        ...prev,
        [currentKey]: {
          feeling: "",
          moods: [],
          symptoms: [],
          vitals: {
            bloodPressure: ["", ""],
            sugar: "",
            heartRate: "",
            weight: "",
          },
        },
      }));
    }
  }, [currentKey, journals]);

  const journal = journals[currentKey] || {
    feeling: "",
    moods: [],
    symptoms: [],
    vitals: {
      bloodPressure: ["", ""],
      sugar: "",
      heartRate: "",
      weight: "",
    },
  };

  const handleDateChange = (direction: "prev" | "next") => {
    setCurrentDate((prev) => addDays(prev, direction === "next" ? 1 : -1));
  };

  const handleFeelingChange = (text: string) => {
    setJournals((prev) => ({
      ...prev,
      [currentKey]: {
        ...journal,
        feeling: text,
      },
    }));
  };

  const setSelectedMoods = (newMoods: string[]) => {
    setJournals((prev) => ({
      ...prev,
      [currentKey]: {
        ...journal,
        moods: newMoods,
      },
    }));
  };
  const setSelectedSymptoms = (newSymptoms: string[]) => {
    setJournals((prev) => ({
      ...prev,
      [currentKey]: {
        ...journal,
        symptoms: newSymptoms,
      },
    }));
  };

  const toggleSelection = (item: string, list: string[], setList: (list: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleVitalChange = (field: keyof JournalData["vitals"], value: string | [string, string]) => {
    setJournals((prev) => ({
      ...prev,
      [currentKey]: {
        ...journal,
        vitals: {
          ...journal.vitals,
          [field]: value,
        },
      },
    }));
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      {/* --- HEADER SECTION --- */}
      <View style={styles.headerContainer}>
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
        {/* Date Navigator */}
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => handleDateChange("prev")}>
            <Icon name="chevron-left" size={30} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatDate(currentDate)}</Text>
          <TouchableOpacity onPress={() => handleDateChange("next")}>
            <Icon name="chevron-right" size={30} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* --- CARD 1: FEELING --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How are you feeling?</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Type here.."
            placeholderTextColor={colors.secondary}
            multiline
            value={journal.feeling}
            onChangeText={handleFeelingChange}
          />
        </View>
        {/* --- CARD 2: MOOD --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mood</Text>
          <View style={styles.chipContainer}>
            {moods.map((mood) => (
              <Chip
                key={mood}
                label={mood}
                selected={journal.moods.includes(mood)}
                onPress={() => toggleSelection(mood, journal.moods, setSelectedMoods)}
              />
            ))}
          </View>
        </View>
        {/* --- CARD 3: SYMPTOMS --- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Symptoms</Text>
          <View style={styles.chipContainer}>
            {symptoms.map((symptom) => (
              <Chip
                key={symptom}
                label={symptom}
                selected={journal.symptoms.includes(symptom)}
                onPress={() => toggleSelection(symptom, journal.symptoms, setSelectedSymptoms)}
              />
            ))}
          </View>
        </View>
        {/* --- CARD 4: VITALS --- */}
        <View style={styles.card}>
          <VitalRow
            label="Blood Pressure"
            unit=""
            isDoubleInput
            value={journal.vitals.bloodPressure}
            onChange={(v: [string, string]) => handleVitalChange("bloodPressure", v)}
          />
          <VitalRow
            label="Sugar Level"
            unit="mmol/L"
            value={journal.vitals.sugar}
            onChange={(v: string) => handleVitalChange("sugar", v)}
          />
          <VitalRow
            label="Heart Rate"
            unit="bpm"
            value={journal.vitals.heartRate}
            onChange={(v: string) => handleVitalChange("heartRate", v)}
          />
          <VitalRow
            label="Weight"
            unit="kg"
            value={journal.vitals.weight}
            onChange={(v: string) => handleVitalChange("weight", v)}
          />
        </View>
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
});
