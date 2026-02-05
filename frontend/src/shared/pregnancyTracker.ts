// frontend/src/shared/pregnancyTracker.ts

export type BabySizeInfo = {
  comparison: string;
  lengthCm: number;
  weightG: number;
};

export type PregnancySnapshot = {
  week: number;        // 1..40
  totalWeeks: number;  // 40
  progressPct: number; // 0..100
  babySize: BabySizeInfo;
};

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

/**
 * Size milestones (medically reasonable, UX-friendly).
 * Values are approximate and intentionally rounded.
 */
const MILESTONES: Array<{
  week: number;
  comparison: string;
  lengthCm: number;
  weightG: number;
}> = [
  { week: 4, comparison: "poppy seed", lengthCm: 0.2, weightG: 0.1 },
  { week: 6, comparison: "pea", lengthCm: 0.4, weightG: 0.5 },
  { week: 8, comparison: "cherry", lengthCm: 1.6, weightG: 1.0 },
  { week: 9, comparison: "raspberry", lengthCm: 2.4, weightG: 3.0 },
  { week: 10, comparison: "strawberry", lengthCm: 3.1, weightG: 4.0 },
  { week: 12, comparison: "lime", lengthCm: 5.4, weightG: 14 },
  { week: 14, comparison: "lemon", lengthCm: 8.7, weightG: 43 },
  { week: 16, comparison: "avocado", lengthCm: 11.6, weightG: 100 },
  { week: 18, comparison: "bell pepper", lengthCm: 14.2, weightG: 190 },
  { week: 20, comparison: "banana", lengthCm: 16.4, weightG: 300 },
  { week: 22, comparison: "papaya", lengthCm: 27.8, weightG: 430 },
  { week: 24, comparison: "corn", lengthCm: 30.0, weightG: 600 },
  { week: 26, comparison: "zucchini", lengthCm: 35.6, weightG: 760 },
  { week: 28, comparison: "eggplant", lengthCm: 37.6, weightG: 1000 },
  { week: 30, comparison: "cabbage", lengthCm: 39.9, weightG: 1310 },
  { week: 32, comparison: "squash", lengthCm: 42.4, weightG: 1700 },
  { week: 34, comparison: "cantaloupe", lengthCm: 45.0, weightG: 2150 },
  { week: 36, comparison: "papaya (large)", lengthCm: 47.4, weightG: 2620 },
  { week: 38, comparison: "watermelon", lengthCm: 49.8, weightG: 3100 },
  { week: 40, comparison: "pumpkin", lengthCm: 51.0, weightG: 3400 },
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function findBracket(week: number) {
  const sorted = [...MILESTONES].sort((a, b) => a.week - b.week);

  if (week <= sorted[0].week) return { left: sorted[0], right: sorted[0] };
  if (week >= sorted[sorted.length - 1].week)
    return { left: sorted[sorted.length - 1], right: sorted[sorted.length - 1] };

  for (let i = 0; i < sorted.length - 1; i++) {
    const left = sorted[i];
    const right = sorted[i + 1];
    if (week >= left.week && week <= right.week) {
      return { left, right };
    }
  }

  return { left: sorted[0], right: sorted[0] };
}

function nearestComparison(week: number) {
  let best = MILESTONES[0];
  let bestDist = Math.abs(week - best.week);

  for (const m of MILESTONES) {
    const d = Math.abs(week - m.week);
    if (d < bestDist) {
      best = m;
      bestDist = d;
    }
  }
  return best.comparison;
}

function snapshotFromWeek(weekInput: number): PregnancySnapshot {
  const totalWeeks = 40;
  const week = clamp(Math.round(weekInput), 1, totalWeeks);

  const { left, right } = findBracket(week);
  const t =
    left.week === right.week
      ? 0
      : (week - left.week) / (right.week - left.week);

  const lengthCm =
    Math.round(lerp(left.lengthCm, right.lengthCm, t) * 10) / 10;
  const weightG = Math.round(lerp(left.weightG, right.weightG, t));
  const comparison = nearestComparison(week);

  const progressPct = clamp(
    Math.round((week / totalWeeks) * 100),
    0,
    100
  );

  return {
    week,
    totalWeeks,
    progressPct,
    babySize: { comparison, lengthCm, weightG },
  };
}

/**
 * Use when pregnancy_week is known.
 */
export function getPregnancySnapshotFromWeek(
  week: number
): PregnancySnapshot {
  return snapshotFromWeek(week);
}

/**
 * Use when EDD is known.
 * Pregnancy assumed to be 40 weeks.
 */
export function getPregnancySnapshotFromDueDate(
  dueDateISO: string,
  now: Date = new Date()
): PregnancySnapshot {
  const due = new Date(dueDateISO);
  if (Number.isNaN(due.getTime())) {
    return snapshotFromWeek(24);
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDue = Math.round((due.getTime() - now.getTime()) / msPerDay);
  const weeksUntilDue = daysUntilDue / 7;

  const rawWeek = 40 - weeksUntilDue;
  return snapshotFromWeek(rawWeek);
}