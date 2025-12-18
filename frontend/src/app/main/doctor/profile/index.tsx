import CertificateUploadCard from "@/src/components/cards/CertificateUploadCard";
import AccountActionsCard from "@/src/components/cards/AccountActionsCard";
import { ProfileCardInput } from "@/src/components/cards/ProfileCardBase";
import { globalStyles, profileStyles } from "@/src/shared/globalStyles";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sizes } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import React, { useState } from "react";
import utils from "@/src/shared/utils";
import { router } from "expo-router";

export default function DoctorProfileScreen() {
  const me = useAuthStore((state) => state.me);
  const signOut = useAuthStore((state) => state.clearAuthState);

  const [fullName, setFullName] = useState(me ? utils.formatFullname(me) : "Olivia Wilson");
  const [email, setEmail] = useState(me?.email || "olivia.wilson@email.com");
  const [mcrNumber, setMcrNumber] = useState("?????");
  const [certificateUri] = useState<string | undefined>(undefined);
  const memberSince = "2025";

  const handleChangePhoto = () => {
    console.log("Change photo pressed");
  };

  const handleCertificateUpload = () => {
    console.log("Certificate upload pressed");
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
              <Text style={profileStyles.profileName}>Dr. {fullName}</Text>
              <Text style={profileStyles.profileSubtext}>Member since {memberSince}</Text>
              {
                <TouchableOpacity style={profileStyles.secondaryButton} onPress={handleChangePhoto}>
                  <Text style={profileStyles.secondaryButtonText}>Change Photo</Text>
                </TouchableOpacity>
              }
            </View>
          </View>
          {/* --------------------------------------------------- */}
          <View style={profileStyles.formContainer}>
            <ProfileCardInput
              inputLabel="Full Name"
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
            <ProfileCardInput
              inputLabel="MCR #"
              fieldValue={mcrNumber}
              placeholder="?????"
              onUpdateField={setMcrNumber}
            />

            {/* Telemedicine Certificate Upload */}
            <CertificateUploadCard
              label="Telemedicine Consultation"
              handleCertificateUpload={handleCertificateUpload}
            />
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
