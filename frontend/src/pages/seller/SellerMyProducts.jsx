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

      setOrders(res.data.orders);
      setPagination(res.data.pagination);
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

  return (
    <div className="w-full min-w-0">
      {/* Header */}
      <div className="mb-6 sm:mb-7">
        <p className="text-xs font-bold tracking-widest text-emerald-600 uppercase">
          Fulfilment
        </p>

        <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
          Orders Management
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Track and manage customer orders for your products.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:p-4 sm:flex-row">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search order or customer…"
            className="w-full min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Statuses</option>

            {statuses.map((item) => (
              <option key={item} value={item}>
                {item.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 sm:p-12 text-center text-xs text-slate-500">
            No orders match your filters.
          </div>
        ) : (
          <>
            {/* =========================
                MOBILE VIEW
            ========================== */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {orders.map((order) => (
                <div key={order.id} className="p-4 sm:p-5">
                  {/* Order Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold font-mono text-sm text-slate-900">
                        #{order.id}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {new Date(order.created_at).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    </div>

                    <select
                      value={order.status}
                      onChange={(e) =>
                        setPendingChange({
                          order,
                          status: e.target.value,
                        })
                      }
                      className={`max-w-[130px] rounded-xl border px-2.5 py-1.5 text-xs font-semibold capitalize focus:outline-none ${
                        order.status === "returned"
                          ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                          : order.status === "cancelled"
                          ? "bg-slate-100 border-slate-300 text-slate-600"
                          : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      {statuses.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Customer */}
                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Customer
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900 break-words">
                      {order.customer}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-400 break-all">
                      {order.customer_email}
                    </p>
                  </div>

                  {/* Products */}
                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Products
                    </p>

                    <div className="mt-2 space-y-1.5">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-3"
                        >
                          <p className="min-w-0 text-xs font-medium text-slate-800 break-words">
                            {item.name}
                          </p>

                          <span className="shrink-0 text-xs font-bold text-slate-700">
                            × {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Amount
                      </p>

                      <p className="mt-1 font-bold font-mono text-sm text-slate-900">
                        {money(order.total)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Payment
                      </p>

                      <span className="mt-1 inline-block rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold">
                        PAID
                      </span>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 p-3">
                    <p className="text-[10px] font-extrabold text-blue-600">
                      ⚡ Auto-Confirmed (3-4 Days)
                    </p>

                    <p className="mt-1 text-[10px] text-blue-700">
                      Standard delivery with end-to-end tracking.
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* =========================
                DESKTOP VIEW
            ========================== */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-[800px] w-full text-xs">
                <thead className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
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
                      className="hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3.5 font-bold font-mono">
                        #{order.id}
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">
                          {order.customer}
                        </p>

                        <p className="text-[11px] text-slate-400 break-all">
                          {order.customer_email}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        {order.items.map((item) => (
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
                      </td>

                      <td className="px-4 py-3.5 font-bold font-mono text-slate-900 whitespace-nowrap">
                        {money(order.total)}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold w-fit">
                            PAID
                          </span>

                          <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full w-fit">
                            ⚡ Auto-Confirmed (3-4 Days)
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            setPendingChange({
                              order,
                              status: e.target.value,
                            })
                          }
                          className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold capitalize focus:outline-none ${
                            order.status === "returned"
                              ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                              : order.status === "cancelled"
                              ? "bg-slate-100 border-slate-300 text-slate-600"
                              : "bg-white border-slate-200 text-slate-800"
                          }`}
                        >
                          {statuses.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </td>

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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-t border-slate-100 px-4 py-3 text-xs">
            <span className="text-slate-500">
              {pagination.total} orders found
            </span>

            <div className="flex gap-2">
              <button
                disabled={!pagination.has_prev}
                onClick={() => setPage(page - 1)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                Previous
              </button>

              <button
                disabled={!pagination.has_next}
                onClick={() => setPage(page + 1)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Confirm Modal */}
      {pendingChange && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">
              Update Order Status?
            </h3>

            <p className="mt-2 text-xs text-slate-500">
              Order #{pendingChange.order.id} status will be updated to{" "}
              <span className="font-bold text-slate-900 capitalize">
                {pendingChange.status}
              </span>
              .
            </p>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setPendingChange(null)}
                className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={update}
                className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer"
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
