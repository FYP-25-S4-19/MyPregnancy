import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { colors, sizes, font } from "../../../../shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import DoctorCard from "../../../../components/DoctorCard";
import SearchBar from "../../../../components/SearchBar";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { router } from "expo-router";
import api from "@/src/shared/api";

interface DoctorPreviewData {
  doctor_id: string;
  profile_img_url: string | null;
  first_name: string;
  is_liked: boolean;
}

interface ChannelCreationResponse {
  channel_id: string;
}

export default function ConsultationsScreen() {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data } = useQuery({
    queryKey: ["list of doctors"],
    queryFn: async (): Promise<DoctorPreviewData[]> => {
      try {
        const res = await api.get("/doctors");
        return res.data as DoctorPreviewData[];
      } catch {}
      return [];
    },
  });

  const onChatPress = async (doctorID: string): Promise<void> => {
    try {
      const res = await api.post("/stream/chat/channel", { doctor_id: doctorID });
      const { channel_id }: ChannelCreationResponse = res.data;
      router.push(`/main/mother/chats/${channel_id}`);
    } catch (err) {
      console.error("Channel error:", err);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CONSULTATION</Text>
          <MaterialCommunityIcons name="message-text-outline" size={sizes.xl} color={colors.primary} />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Find the right specialist{"\n"}for your pregnancy journey! 🤰</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>

        {/* Specialist Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Specialist</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Doctor List */}
        <View style={styles.doctorList}>
          {data &&
            data.map((doctorPreview) => (
              <DoctorCard
                key={doctorPreview.doctor_id}
                id={doctorPreview.doctor_id}
                name={"Dr. " + doctorPreview.first_name}
                image={doctorPreview.profile_img_url}
                isFavorite={doctorPreview.is_liked}
                onChatPress={() => onChatPress(doctorPreview.doctor_id)}
              />
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: sizes.m,
    paddingTop: sizes.m,
    paddingBottom: sizes.l,
  },
  headerTitle: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.l,
    lineHeight: 32,
    textAlign: "center",
  },
  searchContainer: {
    marginBottom: sizes.l,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: sizes.m,
    marginBottom: sizes.m,
  },
  sectionTitle: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.text,
  },
  seeAllText: {
    fontSize: font.s,
    color: colors.tabIcon,
    fontWeight: "500",
  },
  doctorList: {
    paddingBottom: sizes.xl,
  },
});
