import AccountActionsCard from "@/src/components/cards/AccountActionsCard";
import { ProfileCardInput } from "@/src/components/cards/ProfileCardBase";
import api from "@/src/shared/api";
import useAuthStore from "@/src/shared/authStore";
import { colors, sizes } from "@/src/shared/designSystem";
import { globalStyles, profileStyles } from "@/src/shared/globalStyles";
import utils from "@/src/shared/utils";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { useQueryClient } from "@tanstack/react-query";
import { useGetProfileImgUrl, useUpdateProfileImgMutation } from "@/src/shared/hooks/useProfile";

type PregnancyStage = "planning" | "pregnant" | "postpartum";

type MyProfileResponse = {
  stage: PregnancyStage | null;
  pregnancy_week: number | null;
  expected_due_date: string | null; // "YYYY-MM-DD"
  baby_date_of_birth: string | null;

  blood_type: string | null;
  allergies: string[];
  diet_preferences: string[];
  medical_conditions: string | null;
};

function toYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseYYYYMMDD(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default function MotherProfileScreen() {
  const queryClient = useQueryClient();

  const me = useAuthStore((state) => state.me);
  const setMe = useAuthStore((state) => state.setMe);

  // -------------------------
  // Basic profile form state
  // -------------------------
  const [firstName, setFirstName] = useState(me?.first_name || "");
  const [middleName, setMiddleName] = useState(me?.middle_name || "");
  const [lastName, setLastName] = useState(me?.last_name || "");
  const [email, setEmail] = useState(me?.email || "");

  const [dobDate, setDobDate] = useState<Date>(() => {
    const parsed = parseYYYYMMDD((me as any)?.date_of_birth);
    return parsed ?? new Date(1998, 0, 1);
  });
  const [showDobPicker, setShowDobPicker] = useState(false);

  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Profile image
  const { data: profileImageUrl, isLoading: isLoadingProfileImage } = useGetProfileImgUrl();
  const { mutate: uploadProfileImage, isPending: isUploadingImage } = useUpdateProfileImgMutation();

  const fullName = useMemo(
    () => `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim(),
    [firstName, middleName, lastName],
  );

  // -------------------------
  // Pregnancy profile state
  // -------------------------
  const [isLoadingPregProfile, setIsLoadingPregProfile] = useState(false);
  const [pregProfileError, setPregProfileError] = useState<string | null>(null);

  const [stage, setStage] = useState<PregnancyStage>("pregnant");

  // Slider week (0..50 as requested)
  const MAX_WEEKS = 50;
  const [weekValue, setWeekValue] = useState<number>(20);

  const [eddDate, setEddDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 20 * 7);
    return d;
  });
  const [showEddPicker, setShowEddPicker] = useState(false);

  const [isSavingPregnancy, setIsSavingPregnancy] = useState(false);

  const memberSince = me?.created_at ? utils.getMemberSinceYear(me.created_at) : "GOING LOW IN CS:GO";

  const loadPregProfile = async () => {
    setIsLoadingPregProfile(true);
    setPregProfileError(null);

    try {
      const res = await api.get<MyProfileResponse>("/accounts/me/profile");
      const data = res.data;

      const s = (data.stage ?? "pregnant") as PregnancyStage;
      setStage(s);

      if (data.pregnancy_week != null) {
        setWeekValue(data.pregnancy_week);
      }

      const parsedEdd = parseYYYYMMDD(data.expected_due_date);
      if (parsedEdd) setEddDate(parsedEdd);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Failed to load pregnancy profile.";
      setPregProfileError(String(msg));
    } finally {
      setIsLoadingPregProfile(false);
    }
  };

  useEffect(() => {
    loadPregProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------
  // Actions
  // -------------------------
  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);

      await api.put("/accounts/pregnant-woman", {
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        email: email,
        date_of_birth: toYYYYMMDD(dobDate),
      });

      setMe({
        ...me!,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        email: email,
        // @ts-ignore
        date_of_birth: toYYYYMMDD(dobDate),
      });

      Alert.alert("Success", "Profile updated successfully");
    } catch (err: any) {
      Alert.alert("Update failed", err?.response?.data?.detail || "Something went wrong");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePregnancyDetails = async () => {
    try {
      setIsSavingPregnancy(true);

      const payload: any = {
        stage,
        pregnancy_week: stage === "pregnant" ? weekValue : null,
        expected_due_date: stage === "pregnant" ? toYYYYMMDD(eddDate) : null,
        baby_date_of_birth: stage === "postpartum" ? null : null,
      };

      await api.put("/accounts/me/pregnancy-details", payload);

      setMe({
        ...me!,
        // @ts-ignore
        pregnancy_stage: stage,
        // @ts-ignore
        pregnancy_week: stage === "pregnant" ? weekValue : null,
        // @ts-ignore
        expected_due_date: stage === "pregnant" ? toYYYYMMDD(eddDate) : null,
      });

      // KEY FIX: Force BabySizeSection to refetch immediately
      await queryClient.invalidateQueries({ queryKey: ["myProfile"] });

      // Optional: also refresh this page’s local state (nice sanity)
      await loadPregProfile();

      Alert.alert("Success", "Pregnancy details saved.");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || "Failed to save pregnancy details.";
      Alert.alert("Save failed", String(msg));
    } finally {
      setIsSavingPregnancy(false);
    }
  };

  const handleChangePhoto = async () => {
    try {
      const formData = await utils.handleChangePhoto();
      if (formData) {
        uploadProfileImage(formData, {
          onSuccess: () => {
            Alert.alert("Success", "Profile photo updated successfully");
          },
          onError: (error: any) => {
            Alert.alert("Upload failed", error?.response?.data?.detail || "Failed to upload photo");
          },
        });
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to pick image");
    }
  };

  const handleSendFeedback = () => router.push("/main/(notab)/feedback");
  const handleChangePassword = () => utils.handleChangePassword();
  const handleDeleteAccount = () => utils.handleDeleteAccount();

  // -------------------------
  // UI helpers
  // -------------------------
  const StageButton = ({ label, value }: { label: string; value: PregnancyStage }) => {
    const active = stage === value;
    return (
      <TouchableOpacity
        style={[styles.stageBtn, active ? styles.stageBtnActive : styles.stageBtnInactive]}
        onPress={() => setStage(value)}
      >
        <Text style={[styles.stageBtnText, active ? styles.stageBtnTextActive : styles.stageBtnTextInactive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const showPregnantFields = stage === "pregnant";

  return (
    <SafeAreaView edges={["top"]} style={globalStyles.screenContainer}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={globalStyles.pageHeader}>
          <Text style={[globalStyles.pageHeaderTitle, profileStyles.profilePageHeaderTitle]}>My Profile</Text>
        </View>

        {/* Basic Profile Card */}
        <View style={profileStyles.card}>
          <View style={profileStyles.profileHeader}>
            {/* Profile Avatar with Image */}
            <View style={profileStyles.avatar}>
              {isLoadingProfileImage ? (
                <ActivityIndicator size="large" color={colors.secondary} />
              ) : profileImageUrl ? (
                <Image
                  source={{ uri: profileImageUrl }}
                  style={{ width: "100%", height: "100%", borderRadius: 40 }}
                  resizeMode="cover"
                />
              ) : null}
            </View>

            <View style={profileStyles.profileInfo}>
              <Text style={profileStyles.profileName}>{fullName}</Text>
              <Text style={profileStyles.profileSubtext}>Member since {memberSince}</Text>

              <TouchableOpacity
                style={[profileStyles.secondaryButton, isUploadingImage && { opacity: 0.6 }]}
                onPress={handleChangePhoto}
                disabled={isUploadingImage}
              >
                <Text style={profileStyles.secondaryButtonText}>
                  {isUploadingImage ? "Uploading..." : "Change Photo"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={profileStyles.formContainer}>
            <ProfileCardInput inputLabel="First name" fieldValue={firstName} onUpdateField={setFirstName} />
            <ProfileCardInput inputLabel="Middle name" fieldValue={middleName} onUpdateField={setMiddleName} />
            <ProfileCardInput inputLabel="Last name" fieldValue={lastName} onUpdateField={setLastName} />
            <ProfileCardInput inputLabel="Email" fieldValue={email} onUpdateField={setEmail} />

            <Text style={styles.inlineLabel}>Date of Birth</Text>
            <TouchableOpacity style={styles.dateField} onPress={() => setShowDobPicker(true)}>
              <Text style={styles.dateFieldText}>{toYYYYMMDD(dobDate)}</Text>
            </TouchableOpacity>

            {showDobPicker && (
              <DateTimePicker
                value={dobDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                accentColor="#FF8FA3"
                onChange={(_, selectedDate) => {
                  setShowDobPicker(false);
                  if (selectedDate) setDobDate(selectedDate);
                }}
              />
            )}

            <TouchableOpacity
              style={[profileStyles.secondaryButton, { marginTop: sizes.m }, isSavingProfile && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={isSavingProfile}
            >
              <Text style={profileStyles.secondaryButtonText}>{isSavingProfile ? "Saving..." : "Save Changes"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pregnancy Details Card */}
        <View style={profileStyles.card}>
          <Text style={profileStyles.cardTitle}>Pregnancy Details</Text>

          {isLoadingPregProfile ? (
            <Text style={{ marginTop: 10 }}>Loading…</Text>
          ) : pregProfileError ? (
            <Text style={{ marginTop: 10 }}>{String(pregProfileError)}</Text>
          ) : (
            <View style={profileStyles.formContainer}>
              <Text style={styles.inlineLabel}>Stage</Text>
              <View style={styles.stageRow}>
                <StageButton label="Planning" value="planning" />
                <StageButton label="Pregnant" value="pregnant" />
                <StageButton label="Postpartum" value="postpartum" />
              </View>

              {showPregnantFields ? (
                <>
                  <Text style={[styles.inlineLabel, { marginTop: sizes.m }]}>Current week</Text>
                  <View style={styles.weekRow}>
                    <Text style={styles.weekValue}>{weekValue}</Text>
                    <Text style={styles.weekHint}>/ {MAX_WEEKS}</Text>
                  </View>

                  <Slider
                    minimumValue={0}
                    maximumValue={MAX_WEEKS}
                    step={1}
                    value={weekValue}
                    onValueChange={setWeekValue}
                    minimumTrackTintColor="#FFB3BA"
                    maximumTrackTintColor="#F3D6DA"
                    thumbTintColor="#FF8FA3"
                  />

                  <Text style={[styles.inlineLabel, { marginTop: sizes.m }]}>EDD (Due Date)</Text>
                  <TouchableOpacity style={styles.dateField} onPress={() => setShowEddPicker(true)}>
                    <Text style={styles.dateFieldText}>{toYYYYMMDD(eddDate)}</Text>
                  </TouchableOpacity>

                  {showEddPicker && (
                    <DateTimePicker
                      value={eddDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      accentColor="#FF8FA3"
                      onChange={(_, selectedDate) => {
                        setShowEddPicker(false);
                        if (selectedDate) setEddDate(selectedDate);
                      }}
                    />
                  )}
                </>
              ) : (
                <Text style={{ marginTop: sizes.s, color: colors.text }}>
                  Week and due date appear only when stage is “Pregnant”.
                </Text>
              )}

              <TouchableOpacity
                style={[profileStyles.secondaryButton, { marginTop: sizes.m }, isSavingPregnancy && { opacity: 0.6 }]}
                onPress={handleSavePregnancyDetails}
                disabled={isSavingPregnancy}
              >
                <Text style={profileStyles.secondaryButtonText}>
                  {isSavingPregnancy ? "Saving..." : "Save Pregnancy Details"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <AccountActionsCard
          onSendFeedback={handleSendFeedback}
          onLogOut={utils.handleSignOut}
          onDeleteAccount={handleDeleteAccount}
        />

        <View style={{ height: sizes.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles: any = {
  inlineLabel: {
    marginTop: sizes.s,
    marginBottom: sizes.xs,
    color: colors.text,
    fontWeight: "600",
  },
  dateField: {
    borderWidth: 1,
    borderColor: "#F3D6DA",
    backgroundColor: colors.white,
    borderRadius: sizes.s,
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.m,
  },
  dateFieldText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  stageRow: {
    flexDirection: "row",
    gap: sizes.s,
    marginTop: sizes.xs,
  },
  stageBtn: {
    flex: 1,
    borderRadius: sizes.s,
    paddingVertical: sizes.s,
    alignItems: "center",
    borderWidth: 1,
  },
  stageBtnActive: {
    backgroundColor: "#FFEEF0",
    borderColor: "#FF8FA3",
  },
  stageBtnInactive: {
    backgroundColor: colors.white,
    borderColor: "#F3D6DA",
  },
  stageBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  stageBtnTextActive: {
    color: colors.text,
  },
  stageBtnTextInactive: {
    color: colors.text,
    opacity: 0.75,
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: sizes.xs,
  },
  weekValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  weekHint: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    opacity: 0.8,
  },
};
