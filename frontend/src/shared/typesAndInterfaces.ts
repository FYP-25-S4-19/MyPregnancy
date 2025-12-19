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

export interface RecipePaginatedResponse {
  recipes: {
    id: number;
    name: string;
    img_url: string;
    description: string;
    category: string;
    is_saved: boolean;
  }[];
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

export type RoleType = "PREGNANT_WOMAN" | "VOLUNTEER_DOCTOR" | "NUTRITIONIST";
//====================================================
//================== MISCELLANEOUS ===================
//====================================================

// Bla - put all your misc interfaces/types, etc.....here
// Would the next person be so kind as to delete this message
