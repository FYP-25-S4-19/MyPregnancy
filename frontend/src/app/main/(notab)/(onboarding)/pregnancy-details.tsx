import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
//import api from "../../../../shared/api";
import { router } from "expo-router";

type PregnancyStage = "planning" | "pregnant" | "postpartum";

const STAGES: { key: PregnancyStage; label: string; desc?: string }[] = [
  { key: "planning", label: "Planning / Pre-pregnancy" },
  { key: "pregnant", label: "Pregnant" },
  { key: "postpartum", label: "Postpartum" },
];

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const ALLERGIES = ["Dairy", "Eggs", "Peanuts", "Seafood", "Gluten", "Soy", "Other"] as const;
const DIET_PREFS = ["No restriction", "Vegetarian", "Vegan", "Halal", "Low-sugar"] as const;

function isValidISODate(dateStr: string) {
  // simple check: YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

export default function PregnancyDetailsScreen() {
  // step 1: pregnancy details, step 2: health profile
  const [step, setStep] = useState<1 | 2>(1);

  const [stage, setStage] = useState<PregnancyStage>("planning");

  // pregnancy fields
  const [pregnancyWeek, setPregnancyWeek] = useState<string>(""); // optional
  const [eddDate, setEddDate] = useState<string>(""); // YYYY-MM-DD
  const [babyDob, setBabyDob] = useState<string>(""); // YYYY-MM-DD

  // health profile fields
  const [bloodType, setBloodType] = useState<string>("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietPrefs, setDietPrefs] = useState<string[]>(["No restriction"]);
  const [medicalConditions, setMedicalConditions] = useState<string>("");

  const [saving, setSaving] = useState(false);

  const step1Valid = useMemo(() => {
    if (stage === "planning") return true;
    if (stage === "pregnant") return isValidISODate(eddDate);
    if (stage === "postpartum") return isValidISODate(babyDob);
    return false;
  }, [stage, eddDate, babyDob]);

  const toggleMulti = (arr: string[], value: string) => {
    if (arr.includes(value)) return arr.filter((x) => x !== value);
    return [...arr, value];
  };

  const toggleDiet = (value: string) => {
    // default "No restriction" behaves nicely
    if (value === "No restriction") return ["No restriction"];
    const withoutDefault = dietPrefs.filter((x) => x !== "No restriction");
    const next = toggleMulti(withoutDefault, value);
    return next.length === 0 ? ["No restriction"] : next;
  };

  const goNextFromStep1 = () => {
    if (!step1Valid) {
      Alert.alert("Incomplete", "Please fill in the required fields before continuing.");
      return;
    }
    setStep(2);
  };

  const onSave = async () => {
    try {
      setSaving(true);

      // 1) Save pregnancy details
      const pregnancyPayload = {
        stage,
        pregnancy_week: pregnancyWeek ? Number(pregnancyWeek) : null,
        expected_due_date: stage === "pregnant" ? eddDate : null,
        baby_date_of_birth: stage === "postpartum" ? babyDob : null,
      };

      await api.put("/accounts/me/pregnancy-details", pregnancyPayload);

      // 2) Save health profile
      const healthPayload = {
        blood_type: bloodType || null,
        allergies,
        diet_preferences: dietPrefs,
        medical_conditions: medicalConditions || null,
      };

      await api.put("/accounts/me/health-profile", healthPayload);

      Alert.alert("Saved", "Your profile has been updated.");
      router.replace("/main/mother/(home)");
    } catch (e: any) {
      console.log(e?.response?.data ?? e);
      Alert.alert("Error", "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: "#F8DDE0" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={{ backgroundColor: "white", borderRadius: 16, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", textAlign: "center", color: "#7A2E2E" }}>
            {step === 1 ? "Your Pregnancy Details" : "Your Health Profile"}
          </Text>

          <Text style={{ marginTop: 8, textAlign: "center", color: "#7A2E2E" }}>
            {step === 1
              ? "This helps us create accurate meal and health recommendations"
              : "We’ll adjust meal plans and alerts according to your health info."}
          </Text>

          {step === 1 ? (
            <>
              {/* Stage selector */}
              <Text style={{ marginTop: 16, fontWeight: "600", color: "#7A2E2E" }}>Which stage are you in?</Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {STAGES.map((s) => (
                  <Pressable
                    key={s.key}
                    onPress={() => setStage(s.key)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: stage === s.key ? "#F0909A" : "#E8B7BC",
                      backgroundColor: stage === s.key ? "#FAD0D4" : "white",
                    }}
                  >
                    <Text style={{ color: "#7A2E2E" }}>{s.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Conditional fields */}
              {stage === "pregnant" && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontWeight: "600", color: "#7A2E2E" }}>Current Pregnancy Week</Text>
                  <TextInput
                    value={pregnancyWeek}
                    onChangeText={setPregnancyWeek}
                    placeholder="e.g. 22"
                    keyboardType="number-pad"
                    style={{
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: "#F0C2C7",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: "white",
                    }}
                  />

                  <Text style={{ marginTop: 12, fontWeight: "600", color: "#7A2E2E" }}>Expected Due Date (EDD) *</Text>
                  <TextInput
                    value={eddDate}
                    onChangeText={setEddDate}
                    placeholder="YYYY-MM-DD"
                    style={{
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: step1Valid ? "#F0C2C7" : "#E45B67",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: "white",
                    }}
                  />
                  <Text style={{ marginTop: 6, color: "#7A2E2E", fontSize: 12 }}>Format: YYYY-MM-DD</Text>
                </View>
              )}

              {stage === "postpartum" && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontWeight: "600", color: "#7A2E2E" }}>Baby’s Date of Birth *</Text>
                  <TextInput
                    value={babyDob}
                    onChangeText={setBabyDob}
                    placeholder="YYYY-MM-DD"
                    style={{
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: step1Valid ? "#F0C2C7" : "#E45B67",
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: "white",
                    }}
                  />
                  <Text style={{ marginTop: 6, color: "#7A2E2E", fontSize: 12 }}>Format: YYYY-MM-DD</Text>
                </View>
              )}

              {/* Buttons */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
                <Pressable
                  onPress={() => router.replace("/main/mother/(home)")}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 999,
                    backgroundColor: "#F5B8BE",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>Skip</Text>
                </Pressable>

                <Pressable
                  onPress={goNextFromStep1}
                  disabled={!step1Valid}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 999,
                    backgroundColor: step1Valid ? "#F0909A" : "#F3C6CB",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>Next</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {/* Health profile */}
              <Text style={{ marginTop: 16, fontWeight: "600", color: "#7A2E2E" }}>Blood Type</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {BLOOD_TYPES.map((bt) => (
                  <Pressable
                    key={bt}
                    onPress={() => setBloodType(bt)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: bloodType === bt ? "#F0909A" : "#E8B7BC",
                      backgroundColor: bloodType === bt ? "#FAD0D4" : "white",
                    }}
                  >
                    <Text style={{ color: "#7A2E2E" }}>{bt}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={{ marginTop: 16, fontWeight: "600", color: "#7A2E2E" }}>Allergies</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {ALLERGIES.map((a) => (
                  <Pressable
                    key={a}
                    onPress={() => setAllergies((prev) => toggleMulti(prev, a))}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: allergies.includes(a) ? "#F0909A" : "#E8B7BC",
                      backgroundColor: allergies.includes(a) ? "#FAD0D4" : "white",
                    }}
                  >
                    <Text style={{ color: "#7A2E2E" }}>{a}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={{ marginTop: 16, fontWeight: "600", color: "#7A2E2E" }}>Diet preference?</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {DIET_PREFS.map((d) => {
                  const selected = dietPrefs.includes(d);
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDietPrefs(toggleDiet(d))}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: selected ? "#F0909A" : "#E8B7BC",
                        backgroundColor: selected ? "#FAD0D4" : "white",
                      }}
                    >
                      <Text style={{ color: "#7A2E2E" }}>{d}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ marginTop: 16, fontWeight: "600", color: "#7A2E2E" }}>Medical Conditions</Text>
              <TextInput
                value={medicalConditions}
                onChangeText={setMedicalConditions}
                placeholder="e.g. Mild anemia"
                style={{
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: "#F0C2C7",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  backgroundColor: "white",
                }}
              />

              {/* Buttons */}
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
                <Pressable
                  onPress={() => router.replace("/main/mother/(home)")}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 999,
                    backgroundColor: "#F5B8BE",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>Skip</Text>
                </Pressable>

                <Pressable
                  onPress={onSave}
                  disabled={saving}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 999,
                    backgroundColor: saving ? "#F3C6CB" : "#F0909A",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>{saving ? "Saving..." : "Save"}</Text>
                </Pressable>
              </View>

              <Pressable onPress={() => setStep(1)} style={{ marginTop: 12 }}>
                <Text style={{ textAlign: "center", color: "#7A2E2E", textDecorationLine: "underline" }}>
                  Back to Pregnancy Details
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
