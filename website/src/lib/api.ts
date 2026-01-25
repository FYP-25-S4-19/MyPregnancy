import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Functions
export const websiteAPI = {
  getPublicPages: () => api.get("/website/pages/public"),
  getPublicPage: (slug: string) => api.get(`/website/pages/public/${slug}`),
  getAllPages: () => api.get("/website/pages"),
  getPage: (slug: string) => api.get(`/website/pages/${slug}`),

  updatePage: (slug: string, data: any) => api.put(`/website/pages/${slug}`, data),

  deletePage: (slug: string) => api.delete(`/website/pages/${slug}`),
};

export const authAPI = {
  login: (username: string, password: string) => {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    return api.post("/auth/jwt/login", body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },
  logout: () => api.post("/auth/jwt/logout"),
  getMe: () => api.get("/users/me"),
};

export const usersAPI = {
  getAllUsers: () => api.get("/users"),
  getUser: (id: number) => api.get(`/users/${id}`),
  updateUser: (id: number, data: any) => api.patch(`/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/users/${id}`),
};

export const adminAPI = {
  getAllDoctors: () => api.get("/admin/users/doctors"),
  getAllMothers: () => api.get("/admin/users/mothers"),
  getAllNutritionists: () => api.get("/admin/users/nutrionists"),
  getAllMerchants: () => api.get("/admin/users/merchants"),
  suspendUser: (userId: string) => api.post(`/admin/users/${userId}/suspend`),
  unsuspendUser: (userId: string) => api.post(`/admin/users/${userId}/unsuspend`),
};

export const accountRequestsAPI = {
  getAccountCreationRequests: () => api.get("/accounts/"),
  acceptDoctorRequest: (requestId: number) => api.patch(`/accounts/doctors/${requestId}/accept`),
  rejectDoctorRequest: (requestId: number, reason: string) =>
    api.patch(`/accounts/doctors/${requestId}/reject`, { reject_reason: reason }),
  acceptNutritionistRequest: (requestId: number) => api.patch(`/accounts/nutritionists/${requestId}/accept`),
  rejectNutritionistRequest: (requestId: number, reason: string) =>
    api.patch(`/accounts/nutritionists/${requestId}/reject`, { reject_reason: reason }),
};

export const recipesAPI = {
  getCategories: () => api.get("/recipes/categories"),
  createCategory: (label: string) => api.post("/recipes/admin/categories", { label }),
  updateCategory: (id: number, label: string) => api.patch(`/recipes/admin/categories/${id}`, { label }),
};

export const productsAPI = {
  getCategories: () => api.get("/products/categories"),
  createCategory: (label: string) => api.post("/products/admin/categories", { label }),
  updateCategory: (id: number, label: string) => api.patch(`/products/admin/categories/${id}`, { label }),
};

export const articleCategoriesAPI = {
  getCategories: () => api.get("/articles/categories"),
  createCategory: (label: string) => api.post("/articles/categories", { label }),
  updateCategory: (id: number, label: string) => api.patch(`/articles/admin/categories/${id}`, { label }),
};

export const doctorSpecializationAPI = {
  getSpecializations: () => api.get("/doctor-specializations"),
  createSpecialization: (specialisation: string) => api.post("/doctor-specializations", { specialisation }),
  updateSpecialization: (id: number, specialisation: string) =>
    api.patch(`/admin/doctor-specializations/${id}`, { specialisation }),
};

export const appointmentsAPI = {
  getAllAppointments: () => api.get("/appointments"),
  getAppointment: (id: number) => api.get(`/appointments/${id}`),
  updateAppointment: (id: number, data: any) => api.patch(`/appointments/${id}`, data),
};

export const feedbackAPI = {
  getAllFeedback: (options?: {
    min_rating?: number;
    max_rating?: number;
    sort_by?: "newest" | "oldest" | "highest" | "lowest";
    limit?: number;
  }) => {
    const params = new URLSearchParams();
    if (options?.min_rating) params.append("min_rating", String(options.min_rating));
    if (options?.max_rating) params.append("max_rating", String(options.max_rating));
    if (options?.sort_by) params.append("sort_by", options.sort_by);
    if (options?.limit) params.append("limit", String(options.limit));

    const queryString = params.toString();
    return api.get(`/feedback${queryString ? "?" + queryString : ""}`);
  },
  getStats: () => api.get("/feedback/stats"),
  getFeedbackByUser: (userId: string) => api.get(`/feedback/user/${userId}`),
  createFeedback: (data: any) => api.post("/feedback", data),
};
