import { View, Text, TouchableOpacity, Image } from "react-native";
import { profileStyles } from "@/src/shared/globalStyles";
import { ProfileCardInput } from "./ProfileCardBase";
import { Ionicons } from "@expo/vector-icons";
import { colors, sizes } from "@/src/shared/designSystem";
import React from "react";

interface DoctorProfileCardProps {
  fullName: string;
  email: string;
  mcrNumber: string;
  memberSince: string;
  certificateUri?: string;
  //-----------------------------------------
  onChangePhoto?: () => void;
  onFullnameUpdate: (value: string) => void;
  onEmailUpdate: (value: string) => void;
  onMcrNumberUpdate: (value: string) => void;
  onCertificateUpload?: () => void;
}

export default function DoctorProfileCard({
  fullName,
  email,
  mcrNumber,
  memberSince,
  certificateUri,
  onChangePhoto,
  onFullnameUpdate,
  onEmailUpdate,
  onMcrNumberUpdate,
  onCertificateUpload,
}: DoctorProfileCardProps) {
  return (
    <View style={profileStyles.card}>
      <View style={profileStyles.profileHeader}>
        {/* --------------------------------------------------- */}
        <View style={profileStyles.avatar}>{/*<Text style={profileStyles.avatarText}>{getInitials()}</Text>*/}</View>
        <View style={profileStyles.profileInfo}>
          <Text style={profileStyles.profileName}>Dr. {fullName}</Text>
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
          inputLabel="Full Name"
          fieldValue={fullName}
          placeholder="Enter your full name"
          onUpdateField={onFullnameUpdate}
        />
        <ProfileCardInput
          inputLabel="Email"
          fieldValue={email}
          placeholder="your.email@example.com"
          onUpdateField={onEmailUpdate}
        />
        <ProfileCardInput
          inputLabel="MCR #"
          fieldValue={mcrNumber}
          placeholder="?????"
          onUpdateField={onMcrNumberUpdate}
        />

        {/* Telemedicine Certificate Upload */}
        <View style={profileStyles.inputGroup}>
          <Text style={profileStyles.inputLabel}>Telemedicine Certificate</Text>
          <TouchableOpacity
            style={{
              borderRadius: sizes.borderRadius,
              borderWidth: 1,
              borderColor: colors.lightGray,
              padding: sizes.xl,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FAFAFA",
            }}
            onPress={onCertificateUpload}
          >
            {certificateUri ? (
              <Image
                source={{ uri: certificateUri }}
                style={{
                  width: "100%",
                  height: 150,
                  resizeMode: "contain",
                }}
              />
            ) : (
              <Ionicons name="images-outline" size={48} color={colors.lightGray} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
