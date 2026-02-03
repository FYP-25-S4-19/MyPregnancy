import { AppointmentPreviewData } from "../typesAndInterfaces";
import { useQuery } from "@tanstack/react-query";
import api from "@/src/shared/api";

export interface AppointmentData {
  appointment_id: string;
  doctor_id: string;
  doctor_name: string;
  mother_id: string;
  mother_name: string;
  mother_due_date?: string | null;
  start_time: string;
  status: "PENDING_ACCEPT_REJECT" | "ACCEPTED" | "REJECTED";
}

/**
 * Fetches the appointments for the current month you are in
 */
export const useAppointmentsForMonthQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["Appointments"],
    queryFn: async () => {
      const response = await api.get<AppointmentPreviewData[]>("/appointments/month");
      return response.data;
    },
    enabled,
  });
};

export const useAllAppointments = () => {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async (): Promise<AppointmentData[]> => {
      const response = await api.get<AppointmentData[]>("/appointments/");
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const usePendingAppointmentsCount = () => {
  const { data: appointments } = useAllAppointments();

  return {
    count: appointments ? appointments.filter((appt) => appt.status === "PENDING_ACCEPT_REJECT").length : 0,
    isLoading: appointments === undefined,
  };
};

export const usePendingAppointments = () => {
  const { data: appointments, isLoading, isError, error } = useAllAppointments();

  const pendingAppointments = appointments
    ? appointments.filter((appt) => appt.status === "PENDING_ACCEPT_REJECT")
    : [];

  return {
    appointments: pendingAppointments,
    isLoading,
    isError,
    error,
  };
};

export const useUpcomingAppointments = () => {
  const { data: appointments, isLoading, isError, error } = useAllAppointments();

  const upcomingAppointments = appointments
    ? appointments
        .filter((appt) => appt.status === "ACCEPTED")
        .filter((appt) => new Date(appt.start_time) > new Date())
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    : [];

  return {
    appointments: upcomingAppointments,
    isLoading,
    isError,
    error,
  };
};

export const formatAppointmentDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const formatAppointmentTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
};

export const getWeekNumber = (dateString: string): string => {
  const date = new Date(dateString);
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.floor(diff / oneWeek) + 1;

  // Calculate approximate pregnancy week
  const pregnancyWeek = Math.floor(diff / oneWeek) + 1;
  return `Week ${pregnancyWeek}`;
};
