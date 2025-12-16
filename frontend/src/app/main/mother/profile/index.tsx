import PregnancyDetailsCard from "@/src/components/cards/PregnancyDetailsCard";
import AccountActionsCard from "@/src/components/cards/AccountActionsCard";
import MotherProfileCard from "@/src/components/cards/MotherProfileCard";
import { globalStyles, profileStyles } from "@/src/shared/globalStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView } from "react-native";
import useAuthStore from "@/src/shared/authStore";
import { sizes } from "@/src/shared/designSystem";
import React, { useState } from "react";
import utils from "@/src/shared/utils";
import { router } from "expo-router";

export default function MotherProfileScreen() {
  const me = useAuthStore((state) => state.me);
  const signOut = useAuthStore((state) => state.clearAuthState);

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

  return (
    <SafeAreaView edges={["top"]} style={globalStyles.screenContainer}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={globalStyles.pageHeader}>
          <Text style={[globalStyles.pageHeaderTitle, profileStyles.profilePageHeaderTitle]}>My Profile</Text>
        </View>

        <MotherProfileCard
          fullName={fullName}
          dateOfBirth={dateOfBirth}
          email={email}
          memberSince={memberSince}
          onChangePhoto={handleChangePhoto}
          onFullnameUpdate={setFullName}
          onDateOfBirthUpdate={setDateOfBirth}
          onEmailUpdate={setEmail}
        />
        <PregnancyDetailsCard data={pregnancyData} onUpdateField={handlePregnancyUpdate} />

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
