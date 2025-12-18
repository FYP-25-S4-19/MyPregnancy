import CommunityThreadsSection from "@/src/components/sections/CommunityThreadsSection";
import HomePageHeader from "@/src/components/headers/HomePageHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, View } from "react-native";
import { colors } from "@/src/shared/designSystem";
import { router } from "expo-router";

export default function GuestHomeScreen() {
  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <HomePageHeader greetingText="Hi, Mama!" headerText={""} />
          <View style={{ height: 20 }} />

          <CommunityThreadsSection
            onViewAll={() => router.push("/main/guest/(home)/threads")}
            onThreadPress={(threadID) => router.push(`/main/(notab)/threads/${threadID}`)}
          />
          {/*<View style={{ height: sizes.xl }} />*/}
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
  bellIcon: {
    fontSize: 28,
  },
});
