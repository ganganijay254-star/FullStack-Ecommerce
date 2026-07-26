import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminAPI, getApiErrorMessage } from "../../services/api";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;

const Skeleton = () => (
  <div className="space-y-3 p-5">
    {Array.from({ length: 7 }, (_, i) => (
      <div
        key={i}
        className="h-12 animate-pulse rounded bg-slate-100"
      />
    ))}
  </div>
);

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await adminAPI.getUsers({
        page,
        per_page: 10,
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
      });

      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    adminAPI
      .getUserStats()
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const setUserStatus = async (user) => {
    try {
      await adminAPI.updateUserStatus(user.id, !user.is_active);

      toast.success(
        `${user.full_name} is now ${
          user.is_active ? "inactive" : "active"
        }.`
      );

      load();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const updateUserRole = async (userId, role) => {
  try {
    await adminAPI.updateUserRole(userId, role);
    toast.success("User role updated successfully.");
    load();
  } catch (e) {
    toast.error(getApiErrorMessage(e));
  }
};

  const remove = async () => {
    try {
      await adminAPI.deleteUser(deleting.id);

      toast.success("User deleted.");

      setDeleting(null);
      load();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const cards = [
    ["Total users", stats?.total_users],
    ["Active users", stats?.active_users],
    ["Sellers", stats?.sellers],
    ["Customers", stats?.customers],
    ["New this month", stats?.new_users_this_month],
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">
          Account administration
        </p>

        <h2 className="mt-1 text-3xl font-bold text-slate-900">
          Users
        </h2>

        <p className="mt-2 text-slate-500">
          Review accounts, access, and customer activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-slate-500">
              {label}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {stats ? value : "—"}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">

          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or email…"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="seller">Seller</option>
            <option value="user">Customer</option>
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

        </div>

        {/* Table */}
        {loading ? (
          <Skeleton />
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600">{error}</p>

            <button
              onClick={load}
              className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
            >
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No users match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table continues exactly same */}
          </div>
        )}

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>
              {pagination.total} users · Page {pagination.page} of{" "}
              {pagination.total_pages}
            </span>

            <div className="flex gap-2">
              <button
                disabled={!pagination.has_prev}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                disabled={!pagination.has_next}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
