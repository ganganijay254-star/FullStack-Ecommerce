import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { authAPI, getApiErrorMessage } from "../services/api";

export default function Profile() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Form State
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res = await authAPI.updateProfile({
        full_name: fullName,
        phone: phone,
        avatar_url: avatarUrl,
      });
      if (res.success && res.user) {
        toast.success("Profile updated successfully!");
        const token = localStorage.getItem("token");
        if (token) login(token, res.user);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await authAPI.uploadAvatar(file);
      if (res.success) {
        toast.success("Profile photo uploaded!");
        setAvatarUrl(res.avatar_url);
        if (res.user) {
          const token = localStorage.getItem("token");
          if (token) login(token, res.user);
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const sampleAddresses = [
    {
      id: 1,
      type: "Home",
      name: fullName || "Customer",
      address: "42 Park Avenue, Apartment 8B",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: phone || "+91 98765 43210",
      isDefault: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              {user?.role === "seller" ? "Seller Profile & Settings" : "Customer Workspace"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your profile details, avatar picture, saved addresses, orders & store settings
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/orders"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition"
            >
              My Orders &rarr;
            </Link>
            <Link
              to="/wishlist"
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold text-xs rounded-xl shadow-xs transition"
            >
              My Wishlist ♡
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-xs font-bold transition cursor-pointer border-b-2 px-1 ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Profile & Avatar
          </button>
          <button
            onClick={() => setActiveTab("addresses")}
            className={`pb-3 text-xs font-bold transition cursor-pointer border-b-2 px-1 ${
              activeTab === "addresses"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Saved Delivery Addresses
          </button>
          {user?.role === "seller" && (
            <button
              onClick={() => setActiveTab("store")}
              className={`pb-3 text-xs font-bold transition cursor-pointer border-b-2 px-1 ${
                activeTab === "store"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Store Workspace
            </button>
          )}
        </div>

        {activeTab === "overview" ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-xl">
            {/* Avatar Header & Upload */}
            <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-500 shadow-xs"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-extrabold shadow-inner">
                    {fullName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-slate-900 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-600 transition shadow-xs">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">{fullName}</h3>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase inline-block mt-1">
                  {user?.role} Account
                </span>
                {uploading && <p className="text-xs text-blue-600 font-semibold mt-1">Uploading photo...</p>}
              </div>
            </div>

            {/* Profile Update Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Profile Photo URL (Optional)</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {updating ? "Saving Changes..." : "Update Profile"}
                </button>
              </div>
            </form>
          </div>
        ) : activeTab === "addresses" ? (
          <div className="space-y-4 max-w-2xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold text-slate-900">Your Saved Shipping Addresses</h3>
            </div>

            {sampleAddresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs relative"
              >
                {addr.isDefault && (
                  <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px] rounded-full uppercase">
                    Default Address
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-900 text-sm">{addr.type}</span>
                  <span className="text-xs font-semibold text-slate-600">({addr.name})</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{addr.address}</p>
                <p className="text-xs text-slate-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                <p className="text-xs text-slate-500 mt-2">Mobile: {addr.phone}</p>
              </div>
            ))}
          </div>
        ) : (
          /* Seller Store Workspace Tab */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Seller Merchant Store</h3>
                <p className="text-xs text-slate-500">Verified Seller Account #{user?.id}</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                VERIFIED MERCHANT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Merchant Owner</span>
                <p className="font-bold text-slate-900 text-sm mt-1">{fullName}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-medium">Business Contact</span>
                <p className="font-bold text-slate-900 text-sm mt-1">{phone || "Not set"}</p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/seller/dashboard"
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                Go to Seller Dashboard &rarr;
              </Link>
              <Link
                to="/seller/products"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                + Manage Products Catalog
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
