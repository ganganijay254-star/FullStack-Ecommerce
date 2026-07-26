import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://fullstack-ecommerce-xrd5.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
export const getApiErrorMessage = (error) => {
  if (!error.response) return "Unable to reach the server. Check your connection and try again.";
  if (error.response.status === 403) return "You don't have permission to perform that action.";
  if (error.response.status === 404) return "The requested item could not be found.";
  return error.response.data?.message || "Something went wrong. Please try again.";
};

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
      const token = localStorage.getItem("token");
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/register")
        ) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Product API helpers
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

  uploadImage: (file) => {
  const data = new FormData();
  data.append("image", file);

  return api.post("/api/products/images", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
},

  getMyProducts: (params = {}) =>
    api.get("/api/products/seller/me", { params }).then((res) => res.data),

  toggleActive: (id, is_active) =>
    api.patch(`/api/products/${id}/active`, { is_active }).then((res) => res.data),
};

export const cartAPI = {
  getCart: () => api.get("/api/cart").then((res) => res.data),
  addItem: (productId, quantity = 1) =>
    api.post("/api/cart/items", { product_id: productId, quantity }).then((res) => res.data),
  updateItem: (itemId, quantity) =>
    api.put(`/api/cart/items/${itemId}`, { quantity }).then((res) => res.data),
  removeItem: (itemId) => api.delete(`/api/cart/items/${itemId}`).then((res) => res.data),
  clearCart: () => api.delete("/api/cart").then((res) => res.data),
};

export const wishlistAPI = {
  getItems: () => api.get("/api/wishlist").then((res) => res.data),
  addItem: (productId) => api.post(`/api/wishlist/${productId}`).then((res) => res.data),
  removeItem: (productId) => api.delete(`/api/wishlist/${productId}`).then((res) => res.data),
};

export const authAPI = {
  updateProfile: (data) => api.put("/api/auth/profile", data).then((res) => res.data),
  uploadAvatar: (file) => {
    const data = new FormData();
    data.append("image", file);
    return api.post("/api/auth/avatar", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((res) => res.data);
  },
};

export const orderAPI = {
  createCheckout: () => api.post("/api/orders/checkout").then((res) => res.data),
  verifyPayment: (payload) => api.post("/api/orders/verify", payload).then((res) => res.data),
  getOrders: (params = {}) => api.get("/api/orders", { params }).then((res) => res.data),
  getOrderDetails: (id) => api.get(`/api/orders/${id}`).then((res) => res.data),
  getStats: () => api.get("/api/orders/stats").then((res) => res.data),
  updateStatus: (id, status) => api.patch(`/api/orders/${id}/status`, { status }).then((res) => res.data),
  returnOrder: (id) => api.post(`/api/orders/${id}/return`).then((res) => res.data),
  getSellerDashboard: () => api.get("/api/orders/seller/dashboard").then((res) => res.data),
};

export const reviewAPI = {
  getReviews: (productId, params = {}) =>
    api.get(`/api/products/${productId}/reviews`, { params }).then((res) => res.data),
  createReview: (productId, data) =>
    api.post(`/api/products/${productId}/reviews`, data).then((res) => res.data),
  updateReview: (reviewId, data) =>
    api.put(`/api/reviews/${reviewId}`, data).then((res) => res.data),
  deleteReview: (reviewId) =>
    api.delete(`/api/reviews/${reviewId}`).then((res) => res.data),
  markHelpful: (reviewId) =>
    api.post(`/api/reviews/${reviewId}/helpful`).then((res) => res.data),
};

export const adminAPI = {
  getUsers: (params = {}) => api.get("/api/admin/users", { params }).then((res) => res.data),
  getUser: (id) => api.get(`/api/admin/users/${id}`).then((res) => res.data),
  getUserStats: () => api.get("/api/admin/users/stats").then((res) => res.data),
  updateUserStatus: (id, is_active) => api.patch(`/api/admin/users/${id}/status`, { is_active }).then((res) => res.data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`).then((res) => res.data),
  exportUsers: () => api.get("/api/admin/export/users").then((res) => res.data),
  exportOrders: () => api.get("/api/admin/export/orders").then((res) => res.data),
};

export default api;
