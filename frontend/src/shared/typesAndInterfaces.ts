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
  category: ThreadCategoryData | null;
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
  category: ThreadCategoryData | null;
  comments: ThreadCommentData[];
  like_count: number;
  comment_count: number;
  is_liked_by_current_user: boolean;
}

export interface CreateThreadData {
  title: string;
  content: string;
  category_id?: number | null;
}

export interface ThreadUpdateData {
  title?: string;
  content?: string;
  category_id?: number | null;
}

export interface CreateCommentData {
  content: string;
}

export interface UpdateCommentData {
  content: string;
}
//===================================================
//=================== PRODUCTS ======================
//===================================================
export interface ProductCategory {
  id: number;
  label: string;
}

export interface ProductPreview {
  id: number;
  name: string;
  merchant_name: string;
  category: string;
  price_cents: number;
  img_url: string | null;
  is_liked: boolean;
}

export interface ProductPreviewPaginatedResponse {
  products: ProductPreview[];
  next_cursor: number | null;
  has_more: boolean;
}

export interface ProductDetailedResponse {
  id: number;
  name: string;
  merchant_id: string;
  merchant_name: string;
  category: ProductCategory;
  price_cents: number;
  description: string;
  img_url: string | null;
  is_liked: boolean;
}

export interface ProductMutationData {
  name: string;
  category: string;
  price_cents: number;
  description: string;
  img_file: File | any;
}

export interface ProductDraft {
  id: number;
  name: string | null;
  category_id: number | null;
  category_label: string | null;
  price_cents: number | null;
  description: string | null;
  img_url: string | null;
  created_at: string;
  updated_at: string;
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
  trimester: number;
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
//====================================================
//==================== NOTIFICATIONS =======================
//====================================================
export type NotificationType =
  | "THREAD_LIKE"
  | "THREAD_COMMENT"
  | "COMMENT_LIKE"
  | "COMMENT_REPLY"
  | "NEW_ARTICLE"
  | "APPOINTMENT_REMINDER"
  | "APPOINTMENT_REQUEST"
  | "PRIVATE_MESSAGE";

export interface AppNotificationData {
  id: number;
  recipient_id: string;
  content: string;
  sent_at: string;
  is_seen: boolean;
  type: NotificationType;
  data: {
    thread_id?: number;
    [key: string]: any;
  };
}

export interface AppNotificationListResponse {
  notifications: AppNotificationData[];
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
  // ---- role-specific ----
  mcr_no_id?: number; // Doctor
  shop_name?: string; // Merchant
  date_of_birth?: string; // Pregnant woman
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
  specialisation: string;
  is_liked: boolean;
  avg_rating?: number | null;
  ratings_count?: number;
}

export interface DoctorsPaginatedResponse {
  doctors: DoctorPreviewData[];
  next_cursor: string | null;
  has_more: boolean;
}

export type ChatFilter = "all" | "unread";
