import { Text, View, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { UpsertChannelResponse, DoctorsPaginatedResponse } from "@/src/shared/typesAndInterfaces";
import { colors, sizes, font } from "../../../../shared/designSystem";
import DoctorCard from "../../../../components/cards/DoctorCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SearchBar from "../../../../components/SearchBar";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { router } from "expo-router";
import api from "@/src/shared/api";

export default function ConsultationsScreen() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [submittedQuery, setSubmittedQuery] = useState<string>(""); //search

  const qc= useQueryClient();

  const handleSubmitSearch = () => {
    setSubmittedQuery(searchQuery.trim());
  };

  const {
    data: doctorsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["List of doctors", submittedQuery], //search
    queryFn: async ({ pageParam }) => {
      const cursorParam = pageParam ? `&cursor=${pageParam}` : "";
      const qParam = submittedQuery  ? `&q=${encodeURIComponent(submittedQuery)}`  : "";
      const res = await api.get<DoctorsPaginatedResponse>(`/doctors?limit=5${cursorParam}${qParam}`);
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.next_cursor : undefined;
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (vars: {doctorId: string; nextLike: boolean}) =>{
      if (vars.nextLike) {
        await api.post(`/doctors/${vars.doctorId}/like`);
        return { doctorId: vars.doctorId, is_liked: true};
      }
      await api.delete(`/doctors/${vars.doctorId}/like`);
      return {doctorId: vars.doctorId, is_liked: false};
    },
    onMutate: async ({doctorId, nextLike}) =>{
      const queries = qc.getQueriesData({ queryKey: ["List of doctors"]})

      queries.forEach(([key, oldData]: any)=> {
        if (!oldData) return;
        qc.setQueryData(key, {
          ...oldData,
          pages: oldData.pages.map((p:any)=> ({
            ...p,
            doctors: p.doctors.map((d:any) =>
              d.doctor_id ===doctorId ?{...d, is_liked: nextLike}: d
            ),
          })),
        });
      });
      return {queries};
    },
    onError: (_err, _vars, ctx: any) =>{
      if (!ctx?.queries) return;
      ctx.queries.forEach(([key, oldData]:any) => qc.setQueryData(key, oldData));
    },
  });

  const allDoctors = doctorsData?.pages.flatMap((page) => page.doctors) || [];

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const onChatPress = async (doctorID: string): Promise<void> => {
    try {
      const res = await api.post<UpsertChannelResponse>("/stream/chat/channel", { doctor_id: doctorID });
      router.replace(`/main/mother/chats`);
      router.push(`/main/chat/${res.data.channel_id}`);
    } catch (err) {
      console.error("Channel error:", err);
    }
  };

  const renderHeader = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CONSULTATION</Text>
        <MaterialCommunityIcons name="message-text-outline" size={sizes.xl} color={colors.primary} />
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>Find the right specialist{"\n"}for your pregnancy journey! 🤰</Text>

      

      {/* Specialist Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Specialist</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
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

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={handleSubmitSearch} onSearchPress={handleSubmitSearch}/>
      </View>
      
      <FlatList
        data={allDoctors}
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
            isFavorite={item.is_liked}
            onChatPress={() => onChatPress(item.doctor_id)}
            onFavoritePress={()=> toggleLikeMutation.mutate({doctorId: item.doctor_id, nextLike: !item.is_liked})}
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
  listContent: {
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: sizes.l,
    alignItems: "center",
  },
  emptyLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: sizes.xxl,
  },
  loadingText: {
    marginTop: sizes.m,
    fontSize: font.m,
    color: colors.primary,
  },
  emptyText: {
    textAlign: "center",
    marginTop: sizes.xl,
    fontSize: font.m,
    color: colors.tabIcon,
  },
});
