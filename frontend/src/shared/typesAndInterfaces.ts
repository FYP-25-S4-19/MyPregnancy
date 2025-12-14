export interface MeData {
  id: number;
  email: string;
  /** Age in years (optional) */
  age?: number | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  role: RoleType;
}

export interface JwtData {
  exp: number;
  sub: string;
}

export type RoleType = "PREGNANT_WOMAN" | "VOLUNTEER_DOCTOR" | "NUTRITIONIST";
