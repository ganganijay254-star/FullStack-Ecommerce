import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const initialMount = useRef(true);
  const registerInitiated = useRef(false);

  // Navigate only AFTER user state is committed by React
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    if (user && registerInitiated.current) {
      registerInitiated.current = false;
      switch (user.role) {
        case "admin":
          navigate("/admin/dashboard", { replace: true });
          break;
        case "seller":
          navigate("/seller/dashboard", { replace: true });
          break;
        default:
          navigate("/", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const errs = {};

    if (!form.fullName.trim()) errs.fullName = "Full name is required.";
    else if (form.fullName.trim().length < 2)
      errs.fullName = "Name must be at least 2 characters.";

    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errs.email = "Invalid email format.";

    if (!form.password) errs.password = "Password is required.";
    else if (form.password.length < 6)
      errs.password = "Password must be at least 6 characters.";

    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const registeredUser = await register(
        form.fullName.trim(),
        form.email.trim(),
        form.password,
        form.phone.trim()
      );
      toast.success(`Welcome, ${registeredUser.full_name}!`);
      registerInitiated.current = true;
      // Navigation happens via useEffect when user state is committed
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(message);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Create Account</h1>
          <p className="text-slate-500 mt-1">Join us today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={handleChange("fullName")}
              placeholder="John Doe"
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition focus:ring-2 focus:ring-blue-500/40 ${
                errors.fullName ? "border-red-400" : "border-slate-300"
              }`}
            />
            {errors.fullName && (
              <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              placeholder="you@example.com"
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition focus:ring-2 focus:ring-blue-500/40 ${
                errors.email ? "border-red-400" : "border-slate-300"
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              placeholder="At least 6 characters"
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition focus:ring-2 focus:ring-blue-500/40 ${
                errors.password ? "border-red-400" : "border-slate-300"
              }`}
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={handleChange("confirmPassword")}
              placeholder="Re-enter your password"
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition focus:ring-2 focus:ring-blue-500/40 ${
                errors.confirmPassword ? "border-red-400" : "border-slate-300"
              }`}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone <span className="text-slate-400">(optional)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={handleChange("phone")}
              placeholder="+1 234 567 8900"
              className={`w-full px-4 py-2.5 border rounded-lg outline-none transition focus:ring-2 focus:ring-blue-500/40 border-slate-300`}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

