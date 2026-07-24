import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import { CartProvider } from "./context/CartContext";
import AdminDashboard from "./pages/AdminDashboard";
import AdminManageProducts from "./pages/admin/AdminManageProducts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCategories from "./pages/admin/AdminCategories";
import SellerDashboard from "./pages/SellerDashboard";
import SellerMyProducts from "./pages/seller/SellerMyProducts";
import SellerOrders from "./pages/seller/SellerOrders";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import OrderHistory from "./pages/OrderHistory";

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case "admin":
      return <Navigate to="/admin/dashboard" replace />;
    case "seller":
      return <Navigate to="/seller/dashboard" replace />;
    default:
      return <Home />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* User routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "seller"]}>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "seller"]}>
            <ProductDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute allowedRoles={["user", "admin", "seller"]}>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route path="/wishlist" element={<ProtectedRoute allowedRoles={["user", "admin", "seller"]}><Wishlist /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute allowedRoles={["user", "admin", "seller"]}><OrderHistory /></ProtectedRoute>} />

      {/* Admin routes with nested layout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={null} />
        <Route path="products" element={<AdminManageProducts />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="categories" element={<AdminCategories />} />
      </Route>

      {/* Seller routes with nested layout */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute allowedRoles={["seller"]}>
            <SellerDashboard />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={null} />
        <Route path="products" element={<SellerMyProducts />} />
        <Route path="orders" element={<SellerOrders />} />
      </Route>

      {/* Profile (shared) */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["admin", "seller"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider><AppRoutes /></CartProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
