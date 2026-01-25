import AccountActionsCard from "@/src/components/cards/AccountActionsCard";
import { ProfileCardInput } from "@/src/components/cards/ProfileCardBase";
import useAuthStore from "@/src/shared/authStore";
import { sizes } from "@/src/shared/designSystem";
import { globalStyles, profileStyles } from "@/src/shared/globalStyles";
import api from "@/src/shared/api";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MerchantProfileScreen() {
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
  const [shopName, setShopName] = useState(me?.shop_name || "");
  const [isSaving, setIsSaving] = useState(false);

  const memberSince = "2025";

  const fullName = useMemo(
    () => `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim(),
    [firstName, middleName, lastName]
  );

  // -------------------------
  // Actions
  // -------------------------
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      await api.put("/accounts/merchant", {
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        email: email,
        shop_name: shopName,
      });

      // ✅ Sync auth store
      setMe({
        ...me!,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        email: email,
        shop_name: shopName,
      });

      Alert.alert("Success", "Profile updated successfully");
    } catch (err: any) {
      Alert.alert(
        "Update failed",
        err?.response?.data?.detail || "Something went wrong"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = () => {
    console.log("Change photo pressed");
  };

  const handleSendFeedback = () => {
    router.push("/main/(notab)/feedback");
  };

  const handleChangePassword = () => {
    console.log("Change password pressed");
  };

  const handleDeleteAccount = () => {
    console.log("Delete account pressed");
  };

  const signOut = () => {
    clearAuthState();
    router.replace("/(intro)/whoAreYouJoiningAs");
  };

  return (
    <SafeAreaView edges={["top"]} style={globalStyles.screenContainer}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={globalStyles.pageHeader}>
          <Text style={[globalStyles.pageHeaderTitle, profileStyles.profilePageHeaderTitle]}>
            My Profile
          </Text>
        </View>

        <View style={profileStyles.card}>
          <View style={profileStyles.profileHeader}>
            <View style={profileStyles.avatar} />
            <View style={profileStyles.profileInfo}>
              <Text style={profileStyles.profileName}>{fullName}</Text>
              <Text style={profileStyles.profileSubtext}>
                Member since {memberSince}
              </Text>

              <TouchableOpacity
                style={profileStyles.secondaryButton}
                onPress={handleChangePhoto}
              >
                <Text style={profileStyles.secondaryButtonText}>
                  Change Photo
                </Text>
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

            <ProfileCardInput
              inputLabel="Shop Name"
              fieldValue={shopName}
              placeholder="Enter your shop name"
              onUpdateField={setShopName}
            />

            {/* ✅ Save Button */}
            <TouchableOpacity
              style={[
                profileStyles.secondaryButton,
                { marginTop: sizes.m },
                isSaving && { opacity: 0.6 },
              ]}
              onPress={handleSaveProfile}
              disabled={isSaving}
            >
              <Text style={profileStyles.secondaryButtonText}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Text>
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
