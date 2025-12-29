import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api";

interface JournalPreviewData {
  bp_systolic: number | null;
  bp_diastolic: number | null;
  sugar_level: number;
  heart_rate: number;
  weight: number;
  kick_count: number | null;
}

export const useJournalPreviewData = (entryDate: Date) => {
  return useQuery({
    queryKey: ["journal preview data"],
    queryFn: async (): Promise<JournalPreviewData> => {
      const response = await api.get<JournalPreviewData>(`/journals/${entryDate.toISOString().split("T")[0]}`);
      return response.data;
    },
  });
};

interface BloodPressureData {
  systolic: number;
  diastolic: number;
}

interface ScalarMetricUpsert {
  metric_id: number;
  value: number;
}

interface UpsertJournalEntryRequest {
  content?: string;
  binary_metric_ids?: number[];
  scalar_metrics?: ScalarMetricUpsert[];
  blood_pressure?: BloodPressureData;
}

export const useUpsertJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryDate, data }: { entryDate: string; data: UpsertJournalEntryRequest }) => {
      const response = await api.put(`/journals/${entryDate}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate journal window queries that might contain this date
      queryClient.invalidateQueries({ queryKey: ["journal-window"] });
      queryClient.invalidateQueries({ queryKey: ["journal preview data"] });
    },
  });
};

// Fallback scalar metric IDs based on seeding order
// Water: 1, Sugar Level: 2, Heart Rate: 3, Weight: 4
export const SCALAR_METRIC_IDS = {
  WATER: 1,
  SUGAR: 2,
  HEART_RATE: 3,
  WEIGHT: 4,
} as const;
