import PregnancyDetailsCard from "@/src/components/cards/PregnancyDetailsCard";
import AccountActionsCard from "@/src/components/cards/AccountActionsCard";
//import MotherProfileCard from "@/src/components/cards/MotherProfileCard";
import { globalStyles, profileStyles } from "@/src/shared/globalStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import useAuthStore from "@/src/shared/authStore";
import { sizes } from "@/src/shared/designSystem";
import React, { useState } from "react";
import utils from "@/src/shared/utils";
import { router } from "expo-router";
import { ProfileCardInput } from "@/src/components/cards/ProfileCardBase";
import CertificateUploadCard from "@/src/components/cards/CertificateUploadCard";

export default function NutritionistProfileScreen() {
  const me = useAuthStore((state) => state.me);
  const signOut = useAuthStore((state) => state.clearAuthState);

  const [fullName, setFullName] = useState(me ? utils.formatFullname(me) : "Olivia Wilson");
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

  return (
    <SafeAreaView edges={["top"]} style={globalStyles.screenContainer}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={globalStyles.pageHeader}>
          <Text style={[globalStyles.pageHeaderTitle, profileStyles.profilePageHeaderTitle]}>My Profile</Text>
        </View>

        <View style={profileStyles.card}>
          <View style={profileStyles.profileHeader}>
            {/* --------------------------------------------------- */}
            <View style={profileStyles.avatar}>
              {/*<Text style={profileStyles.avatarText}>{getInitials()}</Text>*/}
            </View>
            <View style={profileStyles.profileInfo}>
              <Text style={profileStyles.profileName}>{fullName}</Text>
              <Text style={profileStyles.profileSubtext}>Member since {memberSince}</Text>
              {
                <TouchableOpacity style={profileStyles.secondaryButton} onPress={handleChangePhoto}>
                  <Text style={profileStyles.secondaryButtonText}>Change Photo</Text>
                </TouchableOpacity>
              }
            </View>
          </View>
          <View style={profileStyles.formContainer}>
            <ProfileCardInput inputLabel="Full name" fieldValue="" onUpdateField={() => {}} />
            <ProfileCardInput inputLabel="Email" fieldValue="" onUpdateField={() => {}} />
            <CertificateUploadCard label="Certificate" handleCertificateUpload={() => {}} />
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
