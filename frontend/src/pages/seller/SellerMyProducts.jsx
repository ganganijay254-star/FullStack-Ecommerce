import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage, orderAPI } from "../../services/api";

const statuses = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const money = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  })}`;

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pendingChange, setPendingChange] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await orderAPI.getOrders({
        page,
        per_page: 10,
        search: search || undefined,
        status: status || undefined,
      });

      setOrders(res.data.orders || []);
      setPagination(res.data.pagination || null);
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = setTimeout(load, 250);

    return () => clearTimeout(timer);
  }, [load]);

  const update = async () => {
    if (!pendingChange) return;

    try {
      await orderAPI.updateStatus(
        pendingChange.order.id,
        pendingChange.status
      );

      toast.success("Order status updated.");
      setPendingChange(null);
      load();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const getStatusClass = (orderStatus) => {
    switch (orderStatus) {
      case "returned":
        return "bg-rose-50 border-rose-200 text-rose-700";
      case "cancelled":
        return "bg-slate-100 border-slate-300 text-slate-600";
      case "delivered":
        return "bg-emerald-50 border-emerald-200 text-emerald-700";
      case "shipped":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "packed":
        return "bg-purple-50 border-purple-200 text-purple-700";
      case "confirmed":
        return "bg-cyan-50 border-cyan-200 text-cyan-700";
      default:
        return "bg-amber-50 border-amber-200 text-amber-700";
    }
  };

  return (
    <div className="w-full min-w-0">
      {/* Header */}
      <div className="mb-5 sm:mb-7">
        <p className="text-[10px] sm:text-xs font-bold tracking-widest text-emerald-600 uppercase">
          Fulfilment
        </p>

        <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
          Orders Management
        </h2>

        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Track and manage customer orders for your products.
        </p>
      </div>

      {/* Main Orders Container */}
      <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Filters */}
        <div className="border-b border-slate-200 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search order or customer..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All Statuses</option>

              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="p-10 sm:p-14 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />

            <p className="mt-3 text-xs sm:text-sm text-slate-500">
              Loading orders...
            </p>
          </div>
        ) : orders.length === 0 ? (
          /* Empty */
          <div className="p-10 sm:p-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              📦
            </div>

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No orders found
            </p>

            <p className="mt-1 text-xs text-slate-400">
              No orders match your current filters.
            </p>
          </div>
        ) : (
          <>
            {/* =====================================================
                MOBILE ORDER CARDS
                Visible below lg
            ====================================================== */}
            <div className="block lg:hidden">
              <div className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/50 transition"
                  >
                    {/* Order top */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold font-mono text-sm text-slate-900">
                          Order #{order.id}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400 font-mono">
                          {new Date(order.created_at).toLocaleDateString(
                            "en-IN"
                          )}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Customer */}
                    <div className="mt-4 rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Customer
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900 break-words">
                        {order.customer}
                      </p>

                      {order.customer_email && (
                        <p className="mt-0.5 text-[11px] text-slate-500 break-all">
                          {order.customer_email}
                        </p>
                      )}
                    </div>

                    {/* Products */}
                    <div className="mt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Products
                      </p>

                      <div className="mt-2 space-y-1.5">
                        {order.items?.length ? (
                          order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-3 text-xs"
                            >
                              <p className="min-w-0 font-medium text-slate-800 break-words">
                                {item.name}
                              </p>

                              <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 font-bold text-slate-700">
                                × {item.quantity}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400">
                            No product information.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Amount + Payment */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Amount
                        </p>

                        <p className="mt-1 text-sm font-extrabold font-mono text-slate-900 break-all">
                          {money(order.total)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-100 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Payment
                        </p>

                        <span className="mt-1 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-800">
                          PAID
                        </span>
                      </div>
                    </div>

                    {/* Delivery */}
                    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <p className="text-[10px] font-extrabold text-blue-700">
                        ⚡ Auto-Confirmed · 3–4 Days
                      </p>

                      <p className="mt-0.5 text-[10px] text-blue-600">
                        Standard delivery with end-to-end tracking.
                      </p>
                    </div>

                    {/* Status Update */}
                    <div className="mt-4">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Update Status
                      </label>

                      <select
                        value={order.status}
                        onChange={(e) =>
                          setPendingChange({
                            order,
                            status: e.target.value,
                          })
                        }
                        className={`w-full rounded-xl border px-3 py-2.5 text-xs font-semibold capitalize focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {statuses.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* =====================================================
                DESKTOP TABLE
                Visible lg and above
            ====================================================== */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full min-w-[900px] text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    {[
                      "Order",
                      "Customer",
                      "Products",
                      "Amount",
                      "Payment",
                      "Status",
                      "Date",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3.5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/50 transition"
                    >
                      {/* Order */}
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-900">
                        #{order.id}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">
                          {order.customer}
                        </p>

                        <p className="text-[11px] text-slate-400 break-all">
                          {order.customer_email}
                        </p>
                      </td>

                      {/* Products */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          {order.items?.map((item) => (
                            <p
                              key={item.id}
                              className="font-medium text-slate-800"
                            >
                              {item.name} ×{" "}
                              <span className="font-bold">
                                {item.quantity}
                              </span>
                            </p>
                          ))}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-900 whitespace-nowrap">
                        {money(order.total)}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1.5">
                          <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            PAID
                          </span>

                          <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-600">
                            ⚡ Auto-Confirmed (3-4 Days)
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            setPendingChange({
                              order,
                              status: e.target.value,
                            })
                          }
                          className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold capitalize focus:outline-none ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {statuses.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString(
                          "en-IN"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination && (
          <div className="border-t border-slate-100 px-3 sm:px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[11px] sm:text-xs text-slate-500">
                {pagination.total} orders found
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={!pagination.has_prev}
                  onClick={() => setPage((current) => current - 1)}
                  className="flex-1 sm:flex-none rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50 transition"
                >
                  ← Previous
                </button>

                <span className="hidden sm:block rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  Page {page}
                </span>

                <button
                  disabled={!pagination.has_next}
                  onClick={() => setPage((current) => current + 1)}
                  className="flex-1 sm:flex-none rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50 transition"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* =========================================================
          CONFIRM STATUS MODAL
      ========================================================== */}
      {pendingChange && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Update Order Status?
                </h3>

                <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                  Confirm the new status for this order.
                </p>
              </div>

              <button
                onClick={() => setPendingChange(null)}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* Order info */}
            <div className="mt-5 rounded-xl bg-slate-50 p-3 sm:p-4">
              <p className="text-xs font-bold font-mono text-slate-900">
                Order #{pendingChange.order.id}
              </p>

              <p className="mt-1 text-xs text-slate-500 break-words">
                {pendingChange.order.customer}
              </p>
            </div>

            {/* New status */}
            <div className="mt-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                New Status
              </p>

              <div
                className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusClass(
                  pendingChange.status
                )}`}
              >
                {pendingChange.status}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                onClick={() => setPendingChange(null)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition"
              >
                Cancel
              </button>

              <button
                onClick={update}
                className="w-full sm:w-auto rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 cursor-pointer transition"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
