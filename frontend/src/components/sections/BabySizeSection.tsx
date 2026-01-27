import api from "@/src/shared/api";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { getPregnancySnapshotFromDueDate } from "@/src/shared/pregnancyTracker";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type PregnancyStage = "planning" | "pregnant" | "postpartum";

type MyProfileResponse = {
  stage: PregnancyStage | null;
  pregnancy_week: number | null;
  expected_due_date: string | null; // "YYYY-MM-DD"
  baby_date_of_birth: string | null;
};

function emojiForComparison(comparison: string) {
  const c = (comparison || "").toLowerCase();
  if (c.includes("corn")) return "🌽";
  if (c.includes("pumpkin")) return "🎃";
  if (c.includes("watermelon")) return "🍉";
  if (c.includes("banana")) return "🍌";
  if (c.includes("avocado")) return "🥑";
  if (c.includes("lemon")) return "🍋";
  if (c.includes("lime")) return "🍋";
  if (c.includes("strawberry")) return "🍓";
  if (c.includes("raspberry")) return "🫐";
  if (c.includes("pea")) return "🟢";
  if (c.includes("poppy")) return "⚪️";
  if (c.includes("zucchini")) return "🥒";
  if (c.includes("eggplant")) return "🍆";
  if (c.includes("cabbage")) return "🥬";
  if (c.includes("squash")) return "🎃";
  if (c.includes("papaya")) return "🥭";
  if (c.includes("cantaloupe")) return "🍈";
  return "👶";
}

export default function BabySizeSection() {
  const { data, error } = useQuery({
    queryKey: ["myProfile"],
    queryFn: async () => {
      const res = await api.get<MyProfileResponse>("/accounts/me/profile");
      return res.data;
    },
    staleTime: 30_000,
  });

  const snapshot = useMemo(() => {
    // If not pregnant, show a “neutral” placeholder (or you can hide section instead)
    if (data?.stage && data.stage !== "pregnant") {
      return {
        week: 0,
        totalWeeks: 40,
        progressPct: 0,
        babySize: { comparison: "poppy seed", lengthCm: 0.2, weightG: 0 },
      };
    }

    // IMPORTANT: prefer pregnancy_week (slider) if provided
    if (typeof data?.pregnancy_week === "number") {
      const w = Math.max(0, Math.min(40, data.pregnancy_week));
      // Build a snapshot using due date logic only if you want lengths/weights to align with week:
      // easiest: create a fake due date by shifting now
      const now = new Date();
      const due = new Date(now);
      due.setDate(now.getDate() + (40 - w) * 7);
      return getPregnancySnapshotFromDueDate(due.toISOString().slice(0, 10), now);
    }

    // Fallback to due date
    const dueDateISO = data?.expected_due_date ?? null;
    if (dueDateISO) {
      return getPregnancySnapshotFromDueDate(dueDateISO);
    }

    // Fallback stub (if nothing exists)
    return {
      week: 24,
      totalWeeks: 40,
      progressPct: Math.round((24 / 40) * 100),
      babySize: { comparison: "corn", lengthCm: 30, weightG: 600 },
    };
  }, [data?.stage, data?.pregnancy_week, data?.expected_due_date]);

  const emoji = emojiForComparison(snapshot.babySize.comparison);

  return (
    <>
      {!!error && (
        <View style={{ marginHorizontal: sizes.m, marginBottom: sizes.s }}>
          <Text style={{ fontSize: font.xs, color: colors.text }}>
            Tracker couldn’t load your pregnancy profile.
            {"\n"}
            {String((error as any)?.response?.data?.detail || (error as any)?.message || error)}
          </Text>
        </View>
      )}

      <View style={styles.babySizeCard}>
        <View style={styles.babyCircle}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.weekText}>Week {snapshot.week}</Text>
        </View>

        <View style={styles.babySizeInfo}>
          <Text style={styles.babySizeTitle}>Your baby is now</Text>
          <Text style={styles.babySizeSubtitle}>as big as a {snapshot.babySize.comparison}.</Text>

          <View style={styles.measurements}>
            <Text style={styles.measurementText}>Approx:</Text>
            <Text style={styles.measurementText}>length: {snapshot.babySize.lengthCm} cm</Text>
            <Text style={styles.measurementText}>weight: {snapshot.babySize.weightG} g</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${snapshot.progressPct}%` }]} />
        </View>
        <Text style={styles.weekProgress}>
          Week {snapshot.week}/{snapshot.totalWeeks}
        </Text>
      </View>

      <Text style={styles.progressLabel}>{snapshot.progressPct}% of your pregnancy journey!</Text>
    </>
  );
}

const styles = StyleSheet.create({
  babySizeCard: {
    flexDirection: "row",
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
  emoji: {
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
    backgroundColor: "#FFB3BA",
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