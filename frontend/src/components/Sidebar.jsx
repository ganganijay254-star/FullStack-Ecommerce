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
    <>
      {/* Mobile / Tablet Horizontal Navigation Scroll Bar */}
      <div className="lg:hidden w-full bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {menuItems.map((item, idx) => {
          if (item.divider) return null;
          if (item.logout) {
            return (
              <button
                key="logout-mobile"
                onClick={handleLogout}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 cursor-pointer"
              >
                Logout
              </button>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                "shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition " +
                (isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200")
              }
            >
              {item.label}
            </NavLink>
          );
        })}
      </div>

      {/* Desktop Vertical Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)] flex-shrink-0 hidden lg:flex flex-col sticky top-[57px] h-[calc(100vh-57px)]">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-extrabold text-sm">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.full_name}</p>
              <p className="text-[11px] text-slate-400 font-semibold uppercase">{role}</p>
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
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <span className="w-5 text-center font-bold">{item.icon}</span>
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
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition " +
                  (isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")
                }
              >
                <span className="w-5 text-center font-bold">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
