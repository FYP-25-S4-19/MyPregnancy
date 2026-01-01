import CommunityThreadsSection from "@/src/components/sections/CommunityThreadsSection";
import HomePageHeader from "@/src/components/headers/HomePageHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, StyleSheet } from "react-native";
import { colors, sizes } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import utils from "@/src/shared/utils";
import { router } from "expo-router";
import { AddProductSection } from "@/src/components/sections/AddProductSection";
import { MyProductsSection } from "@/src/components/sections/MyProductSection";

// app/main/merchant/index.tsx (or your specific path)
export default function MerchantHomePage() {
  const me = useAuthStore((state) => state.me);
  const fullname = me ? utils.formatFullname(me) : "";

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <HomePageHeader
            headerText={me ? utils.formatFullname(me) : "Olivia Wilson"}
            profilePicStrFallback={utils.firstLetterOfEveryWordCapitalized(fullname) || "OW"}
          />

          <CommunityThreadsSection
            onViewAll={() => router.push("/main/merchant/(home)/threads")}
            onThreadPress={(threadID) => router.push(`/main/(notab)/threads/${threadID}`)}
          />
          <AddProductSection />
          <MyProductsSection />
          <View style={{ height: sizes.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.veryLightPink,
  },
  scrollView: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: sizes.m,
  },
});
