// frontend/src/shared/menstrualTracker.ts

export type CyclePhase = "period" | "follicular" | "fertile" | "ovulation" | "luteal";

export type MenstrualSnapshot = {
  todayISO: string;

  // Settings echoed back (so UI can show them)
  cycleLengthDays: number;
  periodLengthDays: number;

  // Day in cycle: 1..cycleLengthDays
  cycleDay: number;

  // Progress across cycle: 0..100
  cycleProgressPct: number;

  // Next predicted period start date (YYYY-MM-DD)
  nextPeriodStartISO: string;

  // If >= 0: days until next period. If < 0: days late.
  daysUntilNextPeriod: number;

  // Phase
  phase: CyclePhase;
  phaseLabel: string;

  // Useful dates (YYYY-MM-DD)
  lastPeriodStartISO: string;
  periodEndISO: string;

  fertileStartISO: string;
  fertileEndISO: string;
  ovulationISO: string;

  // Gentle text you can show in UI
  insight: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Stable local YYYY-MM-DD without timezone surprises.
 */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseISOToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function addDaysISO(iso: string, days: number): string {
  const d = parseISOToDate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/**
 * Returns difference in whole days: (a - b)
 */
function diffDaysISO(aISO: string, bISO: string): number {
  const a = parseISOToDate(aISO).getTime();
  const b = parseISOToDate(bISO).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((a - b) / msPerDay);
}

function safeInt(n: number, fallback: number) {
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function labelForPhase(p: CyclePhase): string {
  switch (p) {
    case "period":
      return "Period";
    case "follicular":
      return "Follicular";
    case "fertile":
      return "Fertile window";
    case "ovulation":
      return "Ovulation";
    case "luteal":
      return "Luteal";
    default:
      return "Cycle";
  }
}

function insightForPhase(p: CyclePhase, daysUntilNextPeriod: number): string {
  if (p === "period") return "You’re likely on your period.";
  if (p === "ovulation") return "Likely ovulation day (estimate).";
  if (p === "fertile") return "Likely fertile window (estimate).";
  if (p === "luteal") {
    if (daysUntilNextPeriod <= 3 && daysUntilNextPeriod >= 0) return "Period may be approaching.";
    return "Post-ovulation phase (estimate).";
  }
  return "Pre-ovulation phase (estimate).";
}

/**
 * Minimal-stress cycle model (local-only):
 * - cycle length: 20..45
 * - period length: 2..10
 * - ovulation approx: cycleLength - 14
 * - fertile window: ovulationDay-5 to ovulationDay+1
 */
export function getMenstrualSnapshot(args: {
  lastPeriodStartISO: string;
  cycleLengthDays: number;
  periodLengthDays: number;
  now?: Date;
}): MenstrualSnapshot {
  const now = args.now ?? new Date();
  const todayISO = toISODate(now);

  const cycleLengthDays = clamp(safeInt(args.cycleLengthDays, 28), 20, 45);
  const periodLengthDays = clamp(safeInt(args.periodLengthDays, 5), 2, 10);

  const lastStartISO = args.lastPeriodStartISO;
  const daysSinceStart = diffDaysISO(todayISO, lastStartISO);

  // Guard if lastStartISO is in the future
  const safeDaysSinceStart = Math.max(0, daysSinceStart);

  const cycleDay = (safeDaysSinceStart % cycleLengthDays) + 1;

  const cyclesPassed = Math.floor(safeDaysSinceStart / cycleLengthDays);
  const nextPeriodStartISO = addDaysISO(lastStartISO, (cyclesPassed + 1) * cycleLengthDays);
  const daysUntilNextPeriod = diffDaysISO(nextPeriodStartISO, todayISO);

  const cycleProgressPct = clamp(Math.round((cycleDay / cycleLengthDays) * 100), 0, 100);

  // Ovulation + fertile window estimates
  const ovulationDay = clamp(cycleLengthDays - 14, 8, cycleLengthDays - 6);
  const fertileStartDay = clamp(ovulationDay - 5, 1, cycleLengthDays);
  const fertileEndDay = clamp(ovulationDay + 1, 1, cycleLengthDays);

  const ovulationISO = addDaysISO(lastStartISO, ovulationDay - 1);
  const fertileStartISO = addDaysISO(lastStartISO, fertileStartDay - 1);
  const fertileEndISO = addDaysISO(lastStartISO, fertileEndDay - 1);

  const periodEndISO = addDaysISO(lastStartISO, periodLengthDays - 1);

  let phase: CyclePhase = "follicular";
  if (cycleDay <= periodLengthDays) phase = "period";
  else if (cycleDay === ovulationDay) phase = "ovulation";
  else if (cycleDay >= fertileStartDay && cycleDay <= fertileEndDay) phase = "fertile";
  else if (cycleDay < fertileStartDay) phase = "follicular";
  else phase = "luteal";

  const phaseLabel = labelForPhase(phase);
  const insight = insightForPhase(phase, daysUntilNextPeriod);

  return {
    todayISO,
    cycleLengthDays,
    periodLengthDays,
    cycleDay,
    cycleProgressPct,
    nextPeriodStartISO,
    daysUntilNextPeriod,
    phase,
    phaseLabel,
    lastPeriodStartISO: lastStartISO,
    periodEndISO,
    fertileStartISO,
    fertileEndISO,
    ovulationISO,
    insight,
  };
}