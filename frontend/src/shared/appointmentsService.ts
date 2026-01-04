import api from "@/src/shared/api";

export type DoctorUpcomingAppointment = {
  id: string;
  startAt: string; // ISO datetime string
  patientName: string;
  weekLabel?: string; // e.g. "Week 27"
};

/**
 * Backend contract (to confirm with backend team):
 * GET /appointments/doctor/upcoming
 * Returns: DoctorUpcomingAppointment[]
 */
export async function fetchDoctorUpcomingAppointments() {
  const res = await api.get("/appointments/doctor/upcoming");
  return res.data as DoctorUpcomingAppointment[];
}