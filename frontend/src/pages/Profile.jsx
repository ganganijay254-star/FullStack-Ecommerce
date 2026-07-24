import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Profile</h2>
      <p className="text-sm text-slate-500 mb-6">Your account information.</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-md">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{user?.full_name}</h3>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Email</span>
            <span className="text-slate-800 font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Phone</span>
            <span className="text-slate-800 font-medium">{user?.phone || "Not provided"}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Role</span>
            <span className="text-slate-800 font-medium capitalize">{user?.role}</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Profile editing will be available in a future update.
        </p>
      </div>
    </div>
  );
}
