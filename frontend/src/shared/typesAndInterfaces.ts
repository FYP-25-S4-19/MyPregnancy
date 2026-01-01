//============================================================
//====================== APPOINTMENTS ========================
//============================================================
export type AppointmentStatus = "ACCEPTED" | "REJECTED" | "PENDING_ACCEPT_REJECT";

export interface AppointmentPreviewData {
  appointment_id: string;
  date_time: string;
  doctor_fname: string;
  status: AppointmentStatus;
}

export interface ConsultMessageExtraData {
  isConsultationRequest: boolean;
}

export interface CreateAppointmentResponse {
  appointment_id: string;
}

export interface UpsertChannelResponse {
  channel_id: string;
}
//============================================================
//=================== COMMUNITY THREADS ======================
//============================================================
export interface ThreadCategoryData {
  id: number;
  label: string;
}

export interface ThreadPreviewData {
  id: number;
  creator_name: string;
  title: string;
  content: string;
  posted_at: string;
  categories: ThreadCategoryData[];
  like_count: number;
  comment_count: number;
  is_liked_by_current_user: boolean;
}

export interface ThreadCommentData {
  id: number;
  thread_id: number;
  commenter_id: string;
  commenter_fullname: string;
  commented_at: string;
  content: string;
  like_count: number;
  is_liked_by_current_user: boolean;
}

export interface ThreadData {
  id: number;
  creator_id: string;
  creator_fullname: string;
  title: string;
  content: string;
  posted_at: string;
  comments: ThreadCommentData[];
  categories?: ThreadCategoryData[];
  like_count: number;
  comment_count: number;
  is_liked_by_current_user: boolean;
}

export interface CreateThreadData {
  title: string;
  content: string;
}

export interface CreateCommentData {
  content: string;
}
//==================================================
//=================== RECIPE =======================
//==================================================
export interface RecipeCategory {
  id: number;
  label: string;
}

export interface RecipeData {
  id: number;
  name: string;
  img_url: string;
  description: string;
  category: string;
  is_saved: boolean;
}

export interface RecipePaginatedResponse {
  recipes: RecipeData[];
  next_cursor: number;
  has_more: boolean;
}
//====================================================
//==================== ARTICLE =======================
//====================================================
export interface ArticlePreviewData {
  id: number;
  title: string;
}
//=====================================================
//================== AUTHENTICATION ===================
//=====================================================
export interface MeData {
  id: string;
  email: string;
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

export type RoleType = "PREGNANT_WOMAN" | "VOLUNTEER_DOCTOR" | "NUTRITIONIST" | "MERCHANT";
//====================================================
//================== MISCELLANEOUS ===================
//====================================================

export interface DoctorPreviewData {
  doctor_id: string;
  profile_img_url: string | null;
  first_name: string;
  is_liked: boolean;
}

export interface DoctorsPaginatedResponse {
  doctors: DoctorPreviewData[];
  next_cursor: string | null;
  has_more: boolean;
}
