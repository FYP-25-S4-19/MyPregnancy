// frontend/src/components/sections/BabySizeSection.tsx

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
  expected_due_date: string | null;
  baby_date_of_birth: string | null;
};

function emojiForComparison(comparison: string) {
  const c = (comparison || "").toLowerCase();

  if (c.includes("poppy")) return "⚪️";
  if (c.includes("pea")) return "🟢";

  if (c.includes("raspberry")) return "🍓";
  if (c.includes("strawberry")) return "🍓";
  if (c.includes("cherry")) return "🍒";

  if (c.includes("lime")) return "🍋";
  if (c.includes("lemon")) return "🍋";
  if (c.includes("avocado")) return "🥑";
  if (c.includes("banana")) return "🍌";
  if (c.includes("papaya")) return "🥭";
  if (c.includes("cantaloupe")) return "🍈";
  if (c.includes("watermelon")) return "🍉";
  if (c.includes("pumpkin")) return "🎃";

  if (c.includes("bell pepper")) return "🫑";
  if (c.includes("corn")) return "🌽";
  if (c.includes("zucchini")) return "🥒";
  if (c.includes("squash")) return "🥒";
  if (c.includes("eggplant")) return "🍆";
  if (c.includes("cabbage")) return "🥬";

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
    if (data?.stage !== "pregnant") {
      return null;
    }

    if (typeof data?.pregnancy_week === "number") {
      const w = Math.max(1, Math.min(40, data.pregnancy_week));
      const now = new Date();
      const due = new Date(now);
      due.setDate(now.getDate() + (40 - w) * 7);
      return getPregnancySnapshotFromDueDate(
        due.toISOString().slice(0, 10),
        now
      );
    }

    if (data?.expected_due_date) {
      return getPregnancySnapshotFromDueDate(data.expected_due_date);
    }

    return null;
  }, [data]);

  if (!snapshot) return null;

  const emoji = emojiForComparison(snapshot.babySize.comparison);

  return (
    <>
      {!!error && (
        <View style={{ marginHorizontal: sizes.m, marginBottom: sizes.s }}>
          <Text style={{ fontSize: font.xs, color: colors.text }}>
            Pregnancy tracker couldn’t load.
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
          <Text style={styles.babySizeSubtitle}>
            as big as a {snapshot.babySize.comparison}.
          </Text>

          <View style={styles.measurements}>
            <Text style={styles.measurementText}>Approx:</Text>
            <Text style={styles.measurementText}>
              length: {snapshot.babySize.lengthCm} cm
            </Text>
            <Text style={styles.measurementText}>
              weight: {snapshot.babySize.weightG} g
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${snapshot.progressPct}%` },
            ]}
          />
        </View>
        <Text style={styles.weekProgress}>
          Week {snapshot.week}/{snapshot.totalWeeks}
        </Text>
      </View>

      <Text style={styles.progressLabel}>
        {snapshot.progressPct}% of your pregnancy journey!
      </Text>
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