import { useEffect, useMemo, useState } from "react";
import {
  DoctorUpcomingAppointment,
  fetchDoctorUpcomingAppointments,
} from "@/src/shared/appointmentsService";

const dummyFallback: DoctorUpcomingAppointment[] = [
  {
    id: "dummy_1",
    startAt: "2025-12-11T14:00:00.000Z",
    patientName: "Angie",
    weekLabel: "Week 27",
  },
  {
    id: "dummy_2",
    startAt: "2025-12-15T12:00:00.000Z",
    patientName: "Emily",
    weekLabel: "Week 2",
  },
];

export default function useDoctorUpcomingAppointments() {
  const [data, setData] = useState<DoctorUpcomingAppointment[]>(dummyFallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetchDoctorUpcomingAppointments();
        if (!alive) return;
        setData(Array.isArray(res) ? res : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to fetch appointments");
        setData(dummyFallback);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const count = useMemo(() => data.length, [data]);

  return { data, loading, error, count };
}