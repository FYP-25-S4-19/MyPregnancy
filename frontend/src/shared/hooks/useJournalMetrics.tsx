import { useQuery } from "@tanstack/react-query";
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
      const response = await api.get<JournalPreviewData>(`/journal/${entryDate.toISOString()}`);
      return response.data;
    },
  });
};
