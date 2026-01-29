import AccountActionsCard from "@/src/components/cards/AccountActionsCard";
import CertificateUploadCard from "@/src/components/cards/CertificateUploadCard";
import { ProfileCardInput, ProfileCardReadOnlyInput } from "@/src/components/cards/ProfileCardBase";
import useAuthStore from "@/src/shared/authStore";
import { sizes } from "@/src/shared/designSystem";
import { globalStyles, profileStyles } from "@/src/shared/globalStyles";
import utils from "@/src/shared/utils";
import api from "@/src/shared/api";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";

export default function DoctorProfileScreen() {
  const me = useAuthStore((state) => state.me);
  const setMe = useAuthStore((state) => state.setMe);
  const clearAuthState = useAuthStore((state) => state.clearAuthState);

  // -------------------------
  // Form state
  // -------------------------
  const [firstName, setFirstName] = useState(me?.first_name || "");
  const [middleName, setMiddleName] = useState(me?.middle_name || "");
  const [lastName, setLastName] = useState(me?.last_name || "");
  const [email, setEmail] = useState(me?.email || "");
  const [isSaving, setIsSaving] = useState(false);

  // Certificate image URL
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  const { data: mcrNo } = useQuery({
    queryKey: ["doctor-mcr-number"],
    queryFn: async () => {
      const response = await api.get<{ mcr_no: string | null }>("/accounts/me/mcr-no");
      return response.data.mcr_no;
    },
  });

  const memberSince = "2025";

  const fullName = useMemo(
    () => `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim(),
    [firstName, middleName, lastName],
  );

  // Load qualification certificate on mount
  useEffect(() => {
    const loadCertificate = async () => {
      try {
        const response = await api.get<{ url: string | null }>("/accounts/me/qualification-image-url");
        if (response.data.url) {
          setCertificateUrl(response.data.url);
        }
      } catch (err) {
        console.error("Failed to load qualification certificate:", err);
      }
    };

    loadCertificate();
  }, []);

  // -------------------------
  // Actions
  // -------------------------
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      await api.put("/accounts/doctor", {
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        email: email,
      });

      // ✅ Sync auth store
      setMe({
        ...me!,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        email: email,
      });

      Alert.alert("Success", "Profile updated successfully");
    } catch (err: any) {
      Alert.alert("Update failed", err?.response?.data?.detail || "Something went wrong");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = () => utils.handleChangePhoto();

  const handleCertificateView = () => {
    // Open certificate in a new view or browser
    if (certificateUrl) {
      console.log("View certificate:", certificateUrl);
      // TODO: Open image viewer or browser
    }
  };

  const handleSendFeedback = () => router.push("/main/(notab)/feedback");
  const handleChangePassword = () => utils.handleChangePassword();
  const handleDeleteAccount = () => utils.handleDeleteAccount();

  const signOut = () => {
    clearAuthState();
    router.push("/(intro)");
  };

  return (
    <SafeAreaView edges={["top"]} style={globalStyles.screenContainer}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={globalStyles.pageHeader}>
          <Text style={[globalStyles.pageHeaderTitle, profileStyles.profilePageHeaderTitle]}>My Profile</Text>
        </View>

        <View style={profileStyles.card}>
          <View style={profileStyles.profileHeader}>
            <View style={profileStyles.avatar} />
            <View style={profileStyles.profileInfo}>
              <Text style={profileStyles.profileName}>Dr. {fullName}</Text>
              <Text style={profileStyles.profileSubtext}>Member since {memberSince}</Text>

              <TouchableOpacity style={profileStyles.secondaryButton} onPress={handleChangePhoto}>
                <Text style={profileStyles.secondaryButtonText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ---------------- Form ---------------- */}
          <View style={profileStyles.formContainer}>
            <ProfileCardInput
              inputLabel="First name"
              fieldValue={firstName}
              placeholder="First name"
              onUpdateField={setFirstName}
            />

            <ProfileCardInput
              inputLabel="Middle name"
              fieldValue={middleName}
              placeholder="Middle name (optional)"
              onUpdateField={setMiddleName}
            />

            <ProfileCardInput
              inputLabel="Last name"
              fieldValue={lastName}
              placeholder="Last name"
              onUpdateField={setLastName}
            />

            <ProfileCardInput
              inputLabel="Email"
              fieldValue={email}
              placeholder="your.email@example.com"
              onUpdateField={setEmail}
            />

            <ProfileCardReadOnlyInput inputLabel="MCR # (Not Editable)" fieldValue={mcrNo || "Not Available"} />

            <CertificateUploadCard
              label="Telemedicine Consultation Certificate (View Only)"
              certificateUri={certificateUrl || undefined}
              handleCertificateUpload={handleCertificateView}
            />

            {/* ✅ Save Button */}
            <TouchableOpacity
              style={[profileStyles.secondaryButton, { marginTop: sizes.m }, isSaving && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              <Text style={profileStyles.secondaryButtonText}>{isSaving ? "Saving..." : "Save Changes"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AccountActionsCard
          onSendFeedback={handleSendFeedback}
          onChangePassword={handleChangePassword}
          onLogOut={signOut}
          onDeleteAccount={handleDeleteAccount}
        />

        <View style={{ height: sizes.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
