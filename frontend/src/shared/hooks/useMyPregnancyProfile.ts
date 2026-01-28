import api from "@/src/shared/api";
import { useQuery } from "@tanstack/react-query";

export type MyPregnancyProfile = {
  stage: "planning" | "pregnant" | "postpartum" | null;
  pregnancy_week: number | null;
  expected_due_date: string | null; // ISO date string
  baby_date_of_birth: string | null;
  blood_type: string | null;
  allergies: string[];
  diet_preferences: string[];
  medical_conditions: string | null;
};

export function useMyPregnancyProfile() {
  return useQuery<MyPregnancyProfile>({
    queryKey: ["my-pregnancy-profile"],
    queryFn: async () => {
      const res = await api.get("/accounts/me/profile");
      return res.data;
    },
  });
}