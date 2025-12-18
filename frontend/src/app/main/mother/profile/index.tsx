import PregnancyDetailsCard from "@/src/components/cards/PregnancyDetailsCard";
import { globalStyles, profileStyles } from "@/src/shared/globalStyles";
import MotherProfileCard from "@/src/components/cards/MotherProfileCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, TouchableOpacity, Pressable } from "react-native";
import useAuthStore from "@/src/shared/authStore";
import { colors, shadows, sizes } from "@/src/shared/designSystem";
import React, { useState } from "react";
import utils from "@/src/shared/utils";
import { router } from "expo-router";

export default function MotherProfileScreen() {
  const me = useAuthStore((state) => state.me);
  const signOut = useAuthStore((state) => state.clearAuthState);

  const [profileData, setProfileData] = useState({
    fullName: me ? utils.formatFullname(me) : "Olivia Wilson",
    dateOfBirth: "01/01/1998",
    email: me?.email || "olivia.wilson@email.com",
    memberSince: "2025",
  });

  const [pregnancyData, setPregnancyData] = useState({
    currentWeek: "24",
    dueDate: "02/18/2026",
  });

  const handleProfileUpdate = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePregnancyUpdate = (field: string, value: string) => {
    setPregnancyData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleChangePhoto = () => {
    console.log("Change photo pressed");
  };

  return (
    <SafeAreaView edges={["top"]} style={globalStyles.screenContainer}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={globalStyles.pageHeader}>
          <Text style={[globalStyles.pageHeaderTitle, profileStyles.profilePageHeaderTitle]}>My Profile</Text>
        </View>

        {/* Profile Card */}
        <MotherProfileCard data={profileData} onChangePhoto={handleChangePhoto} onUpdateField={handleProfileUpdate} />

        <Pressable
          onPress={() => router.push("/(onboarding)/pregnancy-details")}/>

        {/* Pregnancy Details Card */}
        <PregnancyDetailsCard data={pregnancyData} onUpdateField={handlePregnancyUpdate} />

        <TouchableOpacity
          style={{
            backgroundColor: colors.white,
            padding: 3,
            marginHorizontal: sizes.m,
            borderRadius: sizes.m,
            alignItems: "center",
            ...shadows.medium,
          }}
          onPress={signOut}
        >
          <Text>Logout</Text>
        </TouchableOpacity>

        {/* Extra spacing at bottom */}
        <View style={{ height: sizes.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
