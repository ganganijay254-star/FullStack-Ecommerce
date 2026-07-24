import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ role, menuItems, onLogout }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)] flex-shrink-0 hidden lg:flex flex-col sticky top-[57px] h-[calc(100vh-57px)]">
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">{role}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item, idx) => {
          if (item.divider) {
            return <div key={"div-" + idx} className="border-t border-slate-100 my-2" />;
          }
          if (item.logout) {
            return (
              <button
                key="logout"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition cursor-pointer"
              >
                <span className="w-6 text-center font-bold">{item.icon}</span>
                {item.label}
              </button>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition " +
                (isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800")
              }
            >
              <span className="w-6 text-center font-bold">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
