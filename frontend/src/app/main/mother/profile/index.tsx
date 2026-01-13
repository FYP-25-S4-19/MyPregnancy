import AccountActionsCard from "@/src/components/cards/AccountActionsCard";
import PregnancyDetailsCard from "@/src/components/cards/PregnancyDetailsCard";
import { ProfileCardInput } from "@/src/components/cards/ProfileCardBase";
import useAuthStore from "@/src/shared/authStore";
import { sizes } from "@/src/shared/designSystem";
import { globalStyles, profileStyles } from "@/src/shared/globalStyles";
import utils from "@/src/shared/utils";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MotherProfileScreen() {
  const me = useAuthStore((state) => state.me);
  const clearAuthState = useAuthStore((state) => state.clearAuthState);

  const [fullName, setFullName] = useState(me ? utils.formatFullname(me) : "Olivia Wilson");
  const [dateOfBirth, setDateOfBirth] = useState<string>("01/01/1998");
  const [email, setEmail] = useState(me?.email || "olivia.wilson@email.com");
  const memberSince = "2025";

  const [pregnancyData, setPregnancyData] = useState({
    currentWeek: "24",
    dueDate: "02/18/2026",
  });

  const handlePregnancyUpdate = (field: string, value: string) => {
    setPregnancyData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  // ✅ FIXED LOGOUT: clear auth, then force-reset route to intro
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
            <View style={profileStyles.avatar}>
              {/*<Text style={profileStyles.avatarText}>{getInitials()}</Text>*/}
            </View>

            <View style={profileStyles.profileInfo}>
              <Text style={profileStyles.profileName}>{fullName}</Text>
              <Text style={profileStyles.profileSubtext}>Member since {memberSince}</Text>

              <TouchableOpacity style={profileStyles.secondaryButton} onPress={handleChangePhoto}>
                <Text style={profileStyles.secondaryButtonText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={profileStyles.formContainer}>
            <ProfileCardInput
              inputLabel="Full name"
              fieldValue={fullName}
              placeholder="Enter your full name"
              onUpdateField={setFullName}
            />
            <ProfileCardInput
              inputLabel="Date of Birth"
              fieldValue={dateOfBirth}
              placeholder="MM/DD/YYYY"
              onUpdateField={setDateOfBirth}
            />
            <ProfileCardInput
              inputLabel="Email"
              fieldValue={email}
              placeholder="your.email@example.com"
              onUpdateField={setEmail}
            />
          </View>
        </View>

        {/* Pregnancy Details Card */}
        <PregnancyDetailsCard data={pregnancyData} onUpdateField={handlePregnancyUpdate} />

        <AccountActionsCard
          onSendFeedback={handleSendFeedback}
          onChangePassword={handleChangePassword}
          onLogOut={signOut}   // ✅ now routes to intro correctly
          onDeleteAccount={handleDeleteAccount}
        />

        <View style={{ height: sizes.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}