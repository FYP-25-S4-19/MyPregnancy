import AccountActionsCard from "@/src/components/cards/AccountActionsCard";
import CertificateUploadCard from "@/src/components/cards/CertificateUploadCard";
import { ProfileCardInput } from "@/src/components/cards/ProfileCardBase";
import useAuthStore from "@/src/shared/authStore";
import { sizes } from "@/src/shared/designSystem";
import { globalStyles, profileStyles } from "@/src/shared/globalStyles";
import utils from "@/src/shared/utils";
import { router } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NutritionistProfileScreen() {
  const me = useAuthStore((state) => state.me);
  const clearAuthState = useAuthStore((state) => state.clearAuthState);

  const [fullName, setFullName] = useState(me ? utils.formatFullname(me) : "Olivia Wilson");
  const [email, setEmail] = useState(me?.email || "olivia.wilson@email.com");
  const memberSince = "2025";

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

  const handleCertificateUpload = () => {
    console.log("Certificate upload pressed");
  };

  // ✅ FIXED LOGOUT
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
              inputLabel="Email"
              fieldValue={email}
              placeholder="your.email@example.com"
              onUpdateField={setEmail}
            />
            <CertificateUploadCard label="Certificate" handleCertificateUpload={handleCertificateUpload} />
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