import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    console.log("[AuthContext] Mount - storedToken:", storedToken ? "exists" : "null", "storedUser:", storedUser ? "exists" : "null");

    if (storedUser && storedToken) {
      // Verify token is still valid by calling /me
      api
        .get("/api/auth/me")
        .then((res) => {
          console.log("[AuthContext] /me SUCCESS - user:", res.data.user);
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));
        })
        .catch((err) => {
          console.log("[AuthContext] /me FAILED -", err.response?.status, err.message);
          // Token invalid or expired
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    console.log("[AuthContext] login() called");
    const response = await api.post("/api/auth/login", { email, password });
    const { token, user: userData } = response.data;
    console.log("[AuthContext] login response - token:", token ? token.substring(0, 20) + "..." : "null", "user:", userData);

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    console.log("[AuthContext] user state set to:", userData);

    return userData;
  }, []);

  const register = useCallback(async (fullName, email, password, phone) => {
    const response = await api.post("/api/auth/register", {
      full_name: fullName,
      email,
      password,
      phone: phone || undefined,
    });
    const { token, user: userData } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const getRedirectPath = useCallback(() => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin":
        return "/admin/dashboard";
      case "seller":
        return "/seller/dashboard";
      default:
        return "/";
    }
  }, [user]);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    getRedirectPath,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;

