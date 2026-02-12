import { Alert, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useGetProfileImgUrl, useUpdateProfileImgMutation } from "@/src/shared/hooks/useProfile";
import AccountActionsCard from "@/src/components/cards/AccountActionsCard";
import { ProfileCardInput } from "@/src/components/cards/ProfileCardBase";
import { globalStyles, profileStyles } from "@/src/shared/globalStyles";
import { SafeAreaView } from "react-native-safe-area-context";
import { sizes, colors } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import { useMemo, useState } from "react";
import utils from "@/src/shared/utils";
import { router } from "expo-router";
import api from "@/src/shared/api";
import { Image } from "expo-image";

export default function MerchantProfileScreen() {
  const me = useAuthStore((state) => state.me);
  const setMe = useAuthStore((state) => state.setMe);

  // -------------------------
  // Form state
  // -------------------------
  const [firstName, setFirstName] = useState(me?.first_name || "");
  const [middleName, setMiddleName] = useState(me?.middle_name || "");
  const [lastName, setLastName] = useState(me?.last_name || "");
  const [email, setEmail] = useState(me?.email || "");
  const [shopName, setShopName] = useState(me?.shop_name || "");
  const [isSaving, setIsSaving] = useState(false);

  // Profile image
  const { data: profileImageUrl, isLoading: isLoadingProfileImage } = useGetProfileImgUrl();
  const { mutate: uploadProfileImage, isPending: isUploadingImage } = useUpdateProfileImgMutation();

  const memberSince = me?.created_at ? utils.getMemberSinceYear(me.created_at) : "GOING LOW IN CS:GO";

  const fullName = useMemo(
    () => `${firstName} ${middleName ? middleName + " " : ""}${lastName}`.trim(),
    [firstName, middleName, lastName],
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
      Alert.alert("Update failed", err?.response?.data?.detail || "Something went wrong");
    } finally {
      setIsSaving(false);
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
  const handleDeleteAccount = () => utils.handleDeleteAccount();

  return (
    <SafeAreaView edges={["top"]} style={globalStyles.screenContainer}>
      <ScrollView style={globalStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={globalStyles.pageHeader}>
          <Text style={[globalStyles.pageHeaderTitle, profileStyles.profilePageHeaderTitle]}>My Profile</Text>
        </View>

        <View style={profileStyles.card}>
          <View style={profileStyles.profileHeader}>
            {/* Profile Avatar with Image */}
            <View style={profileStyles.avatar}>
              {isLoadingProfileImage ? (
                <ActivityIndicator size="large" color={colors.secondary} />
              ) : profileImageUrl ? (
                <Image source={{ uri: profileImageUrl }} style={{ width: "100%", height: "100%", borderRadius: 40 }} />
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

            {/*<ProfileCardInput
              inputLabel="Shop Name"
              fieldValue={shopName}
              placeholder="Enter your shop name"
              onUpdateField={setShopName}
            />*/}

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
          onLogOut={utils.handleSignOut}
          onDeleteAccount={handleDeleteAccount}
        />

        <View style={{ height: sizes.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
