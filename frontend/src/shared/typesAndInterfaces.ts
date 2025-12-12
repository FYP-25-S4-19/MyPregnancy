// export interface LocalMessageExtended

export interface MeData {
  id: number;
  email: string;
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

export interface ConsultMessageExtraData {
  isConsultationRequest: boolean;
}
