import CommunityThreadsSection from "@/src/components/sections/CommunityThreadsSection";
import { AddProductSection } from "@/src/components/sections/AddProductSection";
import { ProductsSection } from "@/src/components/sections/ProductsSection";
import HomePageHeader from "@/src/components/headers/HomePageHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, StyleSheet } from "react-native";
import { colors, sizes } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import utils from "@/src/shared/utils";
import { router } from "expo-router";

export default function MerchantHomeScreen() {
  const me = useAuthStore((state) => state.me);
  const fullname = me ? utils.formatFullname(me) : "";

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <HomePageHeader
            headerText={me ? utils.formatFullname(me) : "Missing name wthelly"}
            profilePicStrFallback={utils.firstLetterOfEveryWordCapitalized(fullname) || "?"}
          />
          <CommunityThreadsSection
            onViewAll={() => router.push("/main/merchant/(home)/threads")}
            onThreadPress={(threadID) => router.push(`/main/(notab)/threads/${threadID}`)}
          />
          <AddProductSection />
          <ProductsSection
            title="My Products"
            showSearch={true}
            showCategoryFilter={true}
            showAllCategoryOption={false}
            onProductCardPress={(productId) => router.replace(`/main/merchant/shop/${productId}`)}
          />
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
