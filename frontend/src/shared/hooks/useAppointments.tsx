import { AppointmentPreviewData } from "../typesAndInterfaces";
import { useQuery } from "@tanstack/react-query";
import api from "../api";

/**
 * Fetches the appointments for the current month you are in
 */
export const useAppointmentsForMonthQuery = () => {
  return useQuery({
    queryKey: ["Appointments"],
    queryFn: async () => {
      const response = await api.get<AppointmentPreviewData[]>("/appointments/month");
      return response.data;
    },
  });
};
