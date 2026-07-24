import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("[API 401] URL:", error.config?.url, "Method:", error.config?.method);
      // Only clear token and redirect if the token is actually expired/invalid
      // NOT if it's a business logic error being returned as 401
      const token = localStorage.getItem("token");
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Only redirect if not already on auth pages
        if (
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/register")
        ) {
          window.location.href = "/login";
        }
      }
    } else {
      console.log("[API Error]", error.response?.status, error.config?.url, error.message);
    }
    return Promise.reject(error);
  }
);

// ─── Product API helpers ───

export const productAPI = {
  getProducts: (params = {}) =>
    api.get("/api/products", { params }).then((res) => res.data),

  getProduct: (id) =>
    api.get(`/api/products/${id}`).then((res) => res.data),

  getCategories: () =>
    api.get("/api/products/categories").then((res) => res.data),

  createProduct: (data) =>
    api.post("/api/products", data).then((res) => res.data),

  updateProduct: (id, data) =>
    api.put(`/api/products/${id}`, data).then((res) => res.data),

  deleteProduct: (id) =>
    api.delete(`/api/products/${id}`).then((res) => res.data),

  getMyProducts: (params = {}) =>
    api.get("/api/products/seller/me", { params }).then((res) => res.data),
};

export default api;

