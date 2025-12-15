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
