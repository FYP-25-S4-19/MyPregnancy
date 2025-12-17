import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { colors } from "@/src/shared/designSystem";
import { profileStyles } from "@/src/shared/globalStyles";

interface MotherProfileData {
  fullName: string;
  dateOfBirth: string;
  email: string;
  memberSince: string;
}

interface MotherProfileCardProps {
  data: MotherProfileData;
  onChangePhoto?: () => void;
  onUpdateField?: (field: string, value: string) => void;
}

export default function MotherProfileCard({ data, onChangePhoto, onUpdateField }: MotherProfileCardProps) {
  const getInitials = () => {
    const names = data.fullName.split(" ");
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return data.fullName.charAt(0).toUpperCase();
  };

  return (
    <View style={profileStyles.card}>
      <View style={profileStyles.profileHeader}>
        <View style={profileStyles.avatar}>
          <Text style={profileStyles.avatarText}>{getInitials()}</Text>
        </View>
        <View style={profileStyles.profileInfo}>
          <Text style={profileStyles.profileName}>{data.fullName}</Text>
          <Text style={profileStyles.profileSubtext}>Member since {data.memberSince}</Text>
          {onChangePhoto && (
            <TouchableOpacity style={profileStyles.secondaryButton} onPress={onChangePhoto}>
              <Text style={profileStyles.secondaryButtonText}>Change Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={profileStyles.formContainer}>
        <View style={profileStyles.inputGroup}>
          <Text style={profileStyles.inputLabel}>Full Name</Text>
          <TextInput
            style={profileStyles.input}
            value={data.fullName}
            onChangeText={(text) => onUpdateField?.("fullName", text)}
            placeholder="Full Name"
            placeholderTextColor={colors.lightGray}
          />
        </View>

        <View style={profileStyles.inputGroup}>
          <Text style={profileStyles.inputLabel}>Date of Birth</Text>
          <TextInput
            style={profileStyles.input}
            value={data.dateOfBirth}
            onChangeText={(text) => onUpdateField?.("dateOfBirth", text)}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.lightGray}
          />
        </View>

        <View style={profileStyles.inputGroup}>
          <Text style={profileStyles.inputLabel}>Email</Text>
          <TextInput
            style={profileStyles.input}
            value={data.email}
            onChangeText={(text) => onUpdateField?.("email", text)}
            placeholder="Email"
            placeholderTextColor={colors.lightGray}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
    </View>
  );
}
