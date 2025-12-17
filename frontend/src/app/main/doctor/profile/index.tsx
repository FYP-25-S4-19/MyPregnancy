import AccountActionsCard from "@/src/components/cards/AccountActionsCard";
import DoctorProfileCard from "@/src/components/cards/DoctorProfileCard";
import { globalStyles, profileStyles } from "@/src/shared/globalStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView } from "react-native";
import useAuthStore from "@/src/shared/authStore";
import { sizes } from "@/src/shared/designSystem";
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
  // TODO: Add setCertificateUri when implementing actual upload functionality
  const memberSince = "2025";

  const handleChangePhoto = () => {
    console.log("Change photo pressed");
  };

  const handleCertificateUpload = () => {
    console.log("Certificate upload pressed");
    // TODO: Implement image picker/document picker
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

        <DoctorProfileCard
          fullName={fullName}
          email={email}
          mcrNumber={mcrNumber}
          memberSince={memberSince}
          certificateUri={certificateUri}
          onChangePhoto={handleChangePhoto}
          onFullnameUpdate={setFullName}
          onEmailUpdate={setEmail}
          onMcrNumberUpdate={setMcrNumber}
          onCertificateUpload={handleCertificateUpload}
        />

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
