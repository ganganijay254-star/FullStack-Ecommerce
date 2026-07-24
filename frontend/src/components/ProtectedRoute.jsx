import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  console.log("[ProtectedRoute] Rendering - user:", user?.id, user?.role, "loading:", loading, "allowedRoles:", allowedRoles, "path:", window.location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("[ProtectedRoute] No user - redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log("[ProtectedRoute] Role mismatch - user role:", user.role, "allowed:", allowedRoles);
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case "admin":
        return <Navigate to="/admin/dashboard" replace />;
      case "seller":
        return <Navigate to="/seller/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  console.log("[ProtectedRoute] Rendering children - user role:", user.role, "is allowed");
  return children;
}

