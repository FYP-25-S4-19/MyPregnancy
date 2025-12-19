import { Text, View, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { UpsertChannelResponse } from "@/src/shared/typesAndInterfaces";
import { colors, sizes, font } from "../../../../shared/designSystem";
import DoctorCard from "../../../../components/cards/DoctorCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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

export default function ConsultationsScreen() {
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: doctors } = useQuery({
    queryKey: ["list of doctors"],
    queryFn: async () => {
      try {
        const res = await api.get<DoctorPreviewData[]>("/doctors");
        return res.data;
      } catch {}
      return [];
    },
  });

  const onChatPress = async (doctorID: string): Promise<void> => {
    try {
      const res = await api.post<UpsertChannelResponse>("/stream/chat/channel", { doctor_id: doctorID });
      router.replace(`/main/mother/chats/`);
      router.push(`/main/mother/chats/${res.data.channel_id}`);
    } catch (err) {
      console.error("Channel error:", err);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
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
        {doctors && (
          <FlatList
            data={doctors}
            keyExtractor={(item) => item.doctor_id}
            renderItem={({ item }) => {
              return (
                <DoctorCard
                  key={item.doctor_id}
                  id={item.doctor_id}
                  name={"Dr. " + item.first_name}
                  image={item.profile_img_url}
                  isFavorite={item.is_liked}
                  onChatPress={() => onChatPress(item.doctor_id)}
                />
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
