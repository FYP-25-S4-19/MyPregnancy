import { View, Text, TouchableOpacity } from "react-native";
import { profileStyles } from "@/src/shared/globalStyles";
import { ProfileCardInput } from "./ProfileCardBase";
import React from "react";

interface MotherProfileCardProps {
  fullName: string;
  dateOfBirth: string;
  email: string;
  memberSince: string;
  //-----------------------------------------
  onChangePhoto?: () => void;
  onFullnameUpdate: (value: string) => void;
  onDateOfBirthUpdate: (value: string) => void;
  onEmailUpdate: (value: string) => void;
}

export default function MotherProfileCard({
  fullName,
  dateOfBirth,
  email,
  memberSince,
  onChangePhoto,
  onFullnameUpdate,
  onDateOfBirthUpdate,
  onEmailUpdate,
}: MotherProfileCardProps) {
  return (
    <View style={profileStyles.card}>
      <View style={profileStyles.profileHeader}>
        {/* --------------------------------------------------- */}
        <View style={profileStyles.avatar}>{/*<Text style={profileStyles.avatarText}>{getInitials()}</Text>*/}</View>
        <View style={profileStyles.profileInfo}>
          <Text style={profileStyles.profileName}>{fullName}</Text>
          <Text style={profileStyles.profileSubtext}>Member since {memberSince}</Text>
          {onChangePhoto && (
            <TouchableOpacity style={profileStyles.secondaryButton} onPress={onChangePhoto}>
              <Text style={profileStyles.secondaryButtonText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {/* --------------------------------------------------- */}
      <View style={profileStyles.formContainer}>
        <ProfileCardInput
          inputLabel="Full name"
          fieldValue={fullName}
          placeholder="Enter your full name"
          onUpdateField={onFullnameUpdate}
        />
        <ProfileCardInput
          inputLabel="Date of Birth"
          fieldValue={dateOfBirth}
          placeholder="MM/DD/YYYY"
          onUpdateField={onDateOfBirthUpdate}
        />
        <ProfileCardInput
          inputLabel="Email"
          fieldValue={email}
          placeholder="your.email@example.com"
          onUpdateField={onEmailUpdate}
        />
      </View>
    </View>
  );
}
