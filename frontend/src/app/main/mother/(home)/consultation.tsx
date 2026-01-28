import { Text, View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useMemo } from "react";
import { router } from "expo-router";

import api from "@/src/shared/api";
import { colors, sizes, font } from "@/src/shared/designSystem";
import SearchBar from "@/src/components/SearchBar";
import DoctorCard from "@/src/components/cards/DoctorCard";
import RatingModal from "@/src/components/modals/RatingModal";

/* ================= TYPES ================= */

type Doctor = {
  doctor_id: string;
  first_name: string;
  profile_img_url: string;
  specialisation: string;
  is_liked: boolean;
  avg_rating: number | null;
  ratings_count: number | null;
};

/* ================= SCREEN ================= */

export default function ConsultationsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedSpecialisation, setSelectedSpecialisation] = useState("All");
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null);

  const queryClient = useQueryClient();

  const handleSubmitSearch = () => {
    setSubmittedQuery(searchQuery.trim());
  };

  /* ================= DOCTORS QUERY ================= */

  const {
    data: doctorsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["doctors", submittedQuery],
    queryFn: async ({ pageParam }) => {
      const cursorParam = pageParam ? `&cursor=${pageParam}` : "";
      const qParam = submittedQuery ? `&q=${encodeURIComponent(submittedQuery)}` : "";
      const res = await api.get<{ doctors: Doctor[]; has_more: boolean; next_cursor?: string }>(
        `/doctors?limit=10${cursorParam}${qParam}`,
      );
      return res.data;
    },
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
  });

  const allDoctors = doctorsData?.pages.flatMap((page) => page.doctors) ?? [];

  /* ================= SPECIALISATIONS FROM DOCTORS ================= */

  const specialisations = useMemo(() => {
    return Array.from(new Set(allDoctors.map((doc) => doc.specialisation)));
  }, [allDoctors]);

  const allSpecialisationChips = useMemo(() => ["All", ...specialisations], [specialisations]);

  /* ================= FILTERED DOCTORS ================= */

  const filteredDoctors = useMemo(() => {
    return allDoctors.filter((doc) => {
      const searchMatch = !submittedQuery || doc.first_name.toLowerCase().includes(submittedQuery.toLowerCase());

      const specialisationMatch = selectedSpecialisation === "All" || doc.specialisation === selectedSpecialisation;

      return searchMatch && specialisationMatch;
    });
  }, [allDoctors, submittedQuery, selectedSpecialisation]);

  /* ================= LIKE MUTATION ================= */

  const toggleLikeMutation = useMutation({
    mutationFn: async (vars: { doctorId: string; nextLike: boolean }) => {
      if (vars.nextLike) {
        await api.post(`/doctors/${vars.doctorId}/like`);
        return { doctorId: vars.doctorId, is_liked: true };
      }
      await api.delete(`/doctors/${vars.doctorId}/like`);
      return { doctorId: vars.doctorId, is_liked: false };
    },
    onMutate: ({ doctorId, nextLike }) => {
      doctorsData?.pages.forEach((page) =>
        page.doctors.forEach((d) => {
          if (d.doctor_id === doctorId) d.is_liked = nextLike;
        }),
      );
    },
  });

  /* ================= LOAD MORE ================= */

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  };

  /* ================= RATING MUTATION ================= */

  const rateDoctorMutation = useMutation({
    mutationFn: async (vars: { doctorId: string; rating: number }) => {
      await api.post(`/doctors/${vars.doctorId}/rating`, { rating: vars.rating });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setRatingModalVisible(false);
      setSelectedDoctor(null);
      Alert.alert("Success", "Your rating has been submitted!");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail || "Failed to submit rating";
      Alert.alert("Error", message);
    },
  });

  const handleRatePress = (doctorId: string, doctorName: string) => {
    setSelectedDoctor({ id: doctorId, name: doctorName });
    setRatingModalVisible(true);
  };

  const handleSubmitRating = (rating: number) => {
    if (selectedDoctor) {
      rateDoctorMutation.mutate({ doctorId: selectedDoctor.id, rating });
    }
  };

  /* ================= CHAT ================= */

  const onChatPress = async (doctorID: string) => {
    try {
      const res = await api.post<{ channel_id: string }>("/stream/chat/channel", { doctor_id: doctorID });
      router.replace(`/main/mother/chats`);
      router.push(`/main/chat/${res.data.channel_id}`);
    } catch (err) {
      console.error("Channel error:", err);
    }
  };

  /* ================= RENDER SPECIALISATION FILTER ================= */

  const renderSpecialisationChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: sizes.m, paddingLeft: sizes.m }}
    >
      {allSpecialisationChips.map((spec) => {
        const active = spec === selectedSpecialisation;
        return (
          <TouchableOpacity
            key={spec}
            onPress={() => setSelectedSpecialisation(active ? "All" : spec)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{spec}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  /* ================= HEADER ================= */

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CONSULTATION</Text>
        <MaterialCommunityIcons name="message-text-outline" size={sizes.xl} color={colors.primary} />
      </View>

      <Text style={styles.subtitle}>Find the right specialist{"\n"}for your pregnancy journey! 🤰</Text>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSubmitSearch}
          onSearchPress={handleSubmitSearch}
        />
      </View>

      {renderSpecialisationChips()}
    </>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  };

  /* ================= RENDER ================= */

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.doctor_id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <DoctorCard
            id={item.doctor_id}
            name={"Dr. " + item.first_name}
            image={item.profile_img_url}
            specialization={item.specialisation}
            isFavorite={item.is_liked}
            rating={item.avg_rating ?? null}
            ratingCount={item.ratings_count ?? 0}
            onChatPress={() => onChatPress(item.doctor_id)}
            onFavoritePress={() => toggleLikeMutation.mutate({ doctorId: item.doctor_id, nextLike: !item.is_liked })}
            onRatePress={() => handleRatePress(item.doctor_id, "Dr. " + item.first_name)}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyLoader}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading doctors...</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No doctors found</Text>
          )
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Rating Modal */}
      <RatingModal
        visible={ratingModalVisible}
        doctorName={selectedDoctor?.name ?? ""}
        onClose={() => {
          setRatingModalVisible(false);
          setSelectedDoctor(null);
        }}
        onSubmit={handleSubmitRating}
        isSubmitting={rateDoctorMutation.isPending}
      />
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: sizes.m,
    paddingTop: sizes.m,
    paddingBottom: sizes.l,
  },
  headerTitle: { fontSize: font.l, fontWeight: "700", color: colors.primary, letterSpacing: 1 },
  subtitle: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.l,
    lineHeight: 32,
    textAlign: "center",
  },
  searchContainer: { marginBottom: sizes.l },
  listContent: { flexGrow: 1 },
  footerLoader: { paddingVertical: sizes.l, alignItems: "center" },
  emptyLoader: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: sizes.xxl },
  loadingText: { marginTop: sizes.m, fontSize: font.m, color: colors.primary },
  emptyText: { textAlign: "center", marginTop: sizes.xl, fontSize: font.m, color: colors.tabIcon },

  chip: {
    backgroundColor: "#FFE9EC",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.s,
    borderRadius: sizes.l,
    marginRight: sizes.s,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: font.xs,
  },
  chipTextActive: {
    color: colors.white,
  },
});
