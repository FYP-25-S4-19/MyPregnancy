import CommunityThreadsSection from "@/src/components/sections/CommunityThreadsSection";
import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import JournalSection from "@/src/components/sections/JournalSection";
import ArticleSection from "@/src/components/sections/ArticleSection";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import useAuthStore from "@/src/shared/authStore";
import { router } from "expo-router";

export default function MotherHomeScreen() {
  const me = useAuthStore((state) => state.me);

  const pregnancyData = {
    week: 24,
    totalWeeks: 40,
    babySize: {
      comparison: "corn",
      length: 30,
      weight: 600,
    },
    userName: me?.first_name || "<MISSING_FNAME>",
    userLastName: me?.last_name || "<MISSING_LNAME>",
  };

  const getInitials = (): string => {
    const firstName = pregnancyData.userName.charAt(0).toUpperCase();
    const lastName = pregnancyData.userLastName.charAt(0).toUpperCase();
    return `${firstName}${lastName}`;
  };

  const getProgressPercentage = (): number => {
    return Math.round((pregnancyData.week / pregnancyData.totalWeeks) * 100);
  };

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
              <View>
                <Text style={styles.greetingText}>Hi, Welcome back,</Text>
                <Text style={styles.userName}>
                  {pregnancyData.userName} {pregnancyData.userLastName}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <View style={styles.notificationDot} />
              <Text style={styles.bellIcon}>🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Baby Size Card */}
          <View style={styles.babySizeCard}>
            <View style={styles.babyCircle}>
              <Text style={styles.cornEmoji}>🌽</Text>
              <Text style={styles.weekText}>Week {pregnancyData.week}</Text>
            </View>

            <View style={styles.babySizeInfo}>
              <Text style={styles.babySizeTitle}>Your baby is now</Text>
              <Text style={styles.babySizeSubtitle}>as big as a {pregnancyData.babySize.comparison}.</Text>
              <View style={styles.measurements}>
                <Text style={styles.measurementText}>Approx:</Text>
                <Text style={styles.measurementText}>length: {pregnancyData.babySize.length} cm</Text>
                <Text style={styles.measurementText}>weight: {pregnancyData.babySize.weight} g</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
            </View>
            <Text style={styles.weekProgress}>
              Week {pregnancyData.week}/{pregnancyData.totalWeeks}
            </Text>
          </View>

          <Text style={styles.progressLabel}>{getProgressPercentage()}% of your pregnancy journey!</Text>

          {/* Journal Card */}
          <JournalSection doFetchMetrics onEdit={() => router.push("/main/mother/journal")} />

          {/* Articles Card */}
          <ArticleSection onViewAll={() => router.push("/main/mother/articles")} />

          <View style={{ height: 20 }} />

          {/* Community Threads Section */}
          <CommunityThreadsSection
            onViewAll={() => router.push("/main/mother/(home)/threads")}
            onThreadPress={(threadID) => router.push(`/main/(notab)/threads/${threadID}`)}
          />

          {/* Extra spacing at bottom */}
          <View style={{ height: sizes.xl }} />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.m,
    backgroundColor: colors.white,
    marginBottom: sizes.m,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: sizes.m,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFB3BA", // Coral pink
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: font.l,
    fontWeight: "700",
    color: colors.white,
  },
  greetingText: {
    fontSize: font.s,
    color: colors.text,
    opacity: 0.6,
  },
  userName: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
  },
  notificationButton: {
    position: "relative",
    padding: sizes.s,
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fail,
    zIndex: 1,
  },
  bellIcon: {
    fontSize: 28,
  },
  babySizeCard: {
    flexDirection: "row",
    // backgroundColor: "#FFD6D9", // Lighter pink
    marginHorizontal: sizes.m,
    paddingVertical: sizes.l,
    paddingHorizontal: sizes.m,
    borderRadius: sizes.m,
    alignItems: "center",
    gap: sizes.m,
    marginBottom: sizes.m,
  },
  babyCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFEEF0",
    borderWidth: 3,
    borderColor: colors.text,
    justifyContent: "center",
    alignItems: "center",
  },
  cornEmoji: {
    fontSize: 60,
    marginBottom: sizes.s,
  },
  weekText: {
    fontSize: font.m,
    fontWeight: "600",
    color: colors.text,
  },
  babySizeInfo: {
    flex: 1,
  },
  babySizeTitle: {
    fontSize: font.m,
    color: colors.text,
    fontWeight: "500",
  },
  babySizeSubtitle: {
    fontSize: font.m,
    color: colors.text,
    fontWeight: "500",
    marginBottom: sizes.s,
  },
  measurements: {
    marginTop: sizes.xs,
  },
  measurementText: {
    fontSize: font.xs,
    color: colors.text,
    lineHeight: 20,
  },
  progressContainer: {
    marginHorizontal: sizes.m,
    marginBottom: sizes.xs,
    position: "relative",
  },
  progressBar: {
    height: 32,
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFB3BA", // Coral pink
  },
  weekProgress: {
    position: "absolute",
    right: sizes.m,
    top: 0,
    bottom: 0,
    fontSize: font.xs,
    color: colors.text,
    fontWeight: "500",
    textAlignVertical: "center",
    lineHeight: 32,
  },
  progressLabel: {
    fontSize: font.s,
    color: colors.text,
    fontWeight: "600",
    marginLeft: sizes.m,
    marginBottom: sizes.m,
  },
});
