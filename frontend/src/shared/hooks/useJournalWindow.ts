import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useMemo } from "react";
import api from "@/src/shared/api";

// Configuration - Adjust these values as needed
const WINDOW_SIZE_DAYS = 14; // ±7 days from current date
const PREFETCH_THRESHOLD = 3; // Prefetch when within 3 days of edge

// Fetch metrics template once (used as fallback when no entries exist)
const fetchMetricsTemplate = async (): Promise<JournalEntry> => {
  const response = await api.get("/journals/metrics/template");
  return response.data;
};

interface BinaryMetricView {
  metric_id: number;
  label: string;
  category: string;
  is_selected: boolean;
}

interface BinaryMetricCategoryGroup {
  category: string;
  binary_metric_logs: BinaryMetricView[];
}

interface ScalarMetricView {
  metric_id: number;
  label: string;
  value: number;
  unit_of_measurement: string;
}

interface BloodPressureData {
  systolic: number;
  diastolic: number;
}

export interface JournalEntry {
  id: number;
  logged_on: string;
  content: string;
  binary_metrics: BinaryMetricCategoryGroup[];
  scalar_metrics: ScalarMetricView[];
  blood_pressure: BloodPressureData;
}

interface UseJournalWindowReturn {
  currentDate: Date;
  navigateToDate: (newDate: Date) => void;
  currentEntry: JournalEntry | null;
  entries: JournalEntry[] | undefined;
  isLoading: boolean;
  error: Error | null;
  windowRange: { start: string; end: string };
  getBinaryMetricsByCategory: () => Record<string, BinaryMetricView[]>;
  getAllAvailableMetrics: () => BinaryMetricCategoryGroup[];
}

export const useJournalWindow = (initialDate: Date): UseJournalWindowReturn => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(initialDate);

  // Calculate window range based on current date
  const windowRange = useMemo(() => {
    const halfWindow = Math.floor(WINDOW_SIZE_DAYS / 2);
    const start = new Date(currentDate);
    start.setDate(start.getDate() - halfWindow);

    const end = new Date(currentDate);
    end.setDate(end.getDate() + halfWindow);

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }, [currentDate]);

  // Fetch metrics template (fallback when no entries exist)
  const { data: metricsTemplate } = useQuery<JournalEntry>(["metrics-template"], fetchMetricsTemplate, {
    staleTime: Infinity, // Template never changes during app session
    cacheTime: Infinity,
  });

  // Fetch journal entries for current window
  const {
    data: entries,
    isLoading,
    error,
  } = useQuery<JournalEntry[]>(
    ["journal-window", windowRange.start, windowRange.end],
    async (): Promise<JournalEntry[]> => {
      const response = await api.get("/journals/range", {
        params: {
          start_date: windowRange.start,
          end_date: windowRange.end,
        },
      });
      return response.data;
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes (cache time in v4)
    },
  );

  // Get entry for specific date
  const getEntryForDate = useCallback(
    (date: Date): JournalEntry | null => {
      const dateStr = date.toISOString().split("T")[0];
      return entries?.find((entry) => entry.logged_on === dateStr) || null;
    },
    [entries],
  );

  // Navigate to date with intelligent prefetching
  const navigateToDate = useCallback(
    (newDate: Date) => {
      const oldDate = currentDate;
      setCurrentDate(newDate);

      // Check if we're near the edge of the window
      const daysDiff = Math.abs((newDate.getTime() - oldDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff >= PREFETCH_THRESHOLD) {
        // Prefetch next window centered on new date
        const halfWindow = Math.floor(WINDOW_SIZE_DAYS / 2);
        const newStart = new Date(newDate);
        newStart.setDate(newStart.getDate() - halfWindow);
        const newEnd = new Date(newDate);
        newEnd.setDate(newEnd.getDate() + halfWindow);

        queryClient.prefetchQuery(
          ["journal-window", newStart.toISOString().split("T")[0], newEnd.toISOString().split("T")[0]],
          async () => {
            const response = await api.get("/journals/range", {
              params: {
                start_date: newStart.toISOString().split("T")[0],
                end_date: newEnd.toISOString().split("T")[0],
              },
            });
            return response.data;
          },
        );
      }
    },
    [currentDate, queryClient],
  );

  // Get current entry
  const currentEntry = useMemo(() => getEntryForDate(currentDate), [currentDate, getEntryForDate]);

  // Helper to get all available metrics from any entry in the window
  // This is useful when currentEntry is null but we still need to show all metric options
  const getAllAvailableMetrics = useCallback((): BinaryMetricCategoryGroup[] => {
    if (currentEntry) {
      return currentEntry.binary_metrics;
    }

    // If no entry for current date, get metrics from any entry in the window
    if (entries && entries.length > 0) {
      return entries[0].binary_metrics;
    }

    // Fallback to metrics template if no entries exist at all
    if (metricsTemplate) {
      return metricsTemplate.binary_metrics;
    }

    return [];
  }, [currentEntry, entries, metricsTemplate]);

  // Helper to group binary metrics by category dynamically
  const getBinaryMetricsByCategory = useCallback((): Record<string, BinaryMetricView[]> => {
    const allMetrics = getAllAvailableMetrics();

    const grouped: Record<string, BinaryMetricView[]> = {};

    allMetrics.forEach((categoryGroup) => {
      grouped[categoryGroup.category] = categoryGroup.binary_metric_logs;
    });

    return grouped;
  }, [getAllAvailableMetrics]);

  return {
    currentDate,
    navigateToDate,
    currentEntry,
    entries,
    isLoading,
    error: error as Error | null,
    windowRange,
    getBinaryMetricsByCategory,
    getAllAvailableMetrics,
  };
};
