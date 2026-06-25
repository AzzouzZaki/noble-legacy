"use client";

import { useEffect, useState, useCallback } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Order {
  id: number;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  shippingAddress: string;
  totalAmount: string;
  status: string | null;
  createdAt: string;
}

type Status = "pending" | "confirmed" | "shipped" | "delivered";

const STATUSES: Status[] = ["pending", "confirmed", "shipped", "delivered"];

/* ------------------------------------------------------------------ */
/*  Status badge colours                                               */
/* ------------------------------------------------------------------ */
const statusStyles: Record<Status, string> = {
  pending:
    "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  confirmed:
    "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  shipped:
    "bg-violet-500/15 text-violet-400 border border-violet-500/20",
  delivered:
    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
};

/* ------------------------------------------------------------------ */
/*  Toast                                                              */
/* ------------------------------------------------------------------ */
interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

let toastId = 0;

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium shadow-lg backdrop-blur-sm transition-all animate-[slideIn_0.25s_ease-out] ${
            t.type === "success"
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
              : "bg-rose-500/15 text-rose-300 border border-rose-500/20"
          }`}
        >
          {t.type === "success" ? (
            <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="size-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-2 text-current/50 hover:text-current transition-colors">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Confirmation Modal                                          */
/* ------------------------------------------------------------------ */
function DeleteModal({
  order,
  onCancel,
  onConfirm,
  loading,
}: {
  order: Order;
  onCancel: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-[scaleIn_0.2s_ease-out]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center size-10 rounded-xl bg-rose-500/15 text-rose-400">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Delete Order</h3>
            <p className="text-slate-400 text-sm">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-slate-300 text-sm mb-6">
          Are you sure you want to delete order{" "}
          <span className="text-white font-medium">#{String(order.id).padStart(3, "0")}</span> from{" "}
          <span className="text-white font-medium">{order.customerName}</span>?
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700/50 hover:bg-slate-700/80 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  /* Toast helpers */
  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* Fetch orders */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data: Order[] = await res.json();
      setOrders(data);
    } catch {
      addToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* Status update */
  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      addToast("Order status updated", "success");
      await fetchOrders();
    } catch {
      addToast("Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  /* Delete */
  const handleDelete = async () => {
    if (!deletingOrder) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/orders/${deletingOrder.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      addToast("Order deleted successfully", "success");
      setDeletingOrder(null);
      await fetchOrders();
    } catch {
      addToast("Failed to delete order", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* Fetch order details */
  const openOrderDetails = async (orderId: number) => {
    setSelectedOrderId(orderId);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedOrderDetails(data);
    } catch {
      addToast("Failed to load order details", "error");
      setSelectedOrderId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrderId(null);
    setSelectedOrderDetails(null);
  };

  /* Helpers */
  const fmtId = (id: number) => `#${String(id).padStart(3, "0")}`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();
  const fmtAmount = (v: string) => `${parseFloat(v).toFixed(2)} DA`;

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-950 p-6 md:p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Orders</h1>
          <p className="text-slate-500 mt-1 text-sm">Track and manage customer orders</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl overflow-hidden">
          {loading ? (
            /* Loading skeleton */
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(90deg, rgb(30 41 59 / 0.5) 25%, rgb(51 65 85 / 0.3) 50%, rgb(30 41 59 / 0.5) 75%)",
                    backgroundSize: "200% 100%",
                    animation: `shimmer 1.5s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          ) : orders.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
              <div className="flex items-center justify-center size-16 rounded-2xl bg-slate-800/80 text-slate-500 mb-5">
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">No orders yet</h3>
              <p className="text-slate-500 text-sm max-w-xs">
                When customers place orders, they&apos;ll appear here for you to manage.
              </p>
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">ID</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Total</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map((order) => {
                    const status = (order.status ?? "pending") as Status;
                    return (
                      <tr
                        key={order.id}
                        className="group hover:bg-slate-800/30 transition-colors cursor-pointer"
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest("select") ||
                            (e.target as HTMLElement).closest("button")
                          ) {
                            return;
                          }
                          openOrderDetails(order.id);
                        }}
                      >
                        {/* ID */}
                        <td className="px-6 py-4 text-white font-medium whitespace-nowrap">
                          {fmtId(order.id)}
                        </td>

                        {/* Customer */}
                        <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                          {order.customerName}
                        </td>

                        {/* Phone */}
                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                          {order.customerPhone ?? "—"}
                        </td>

                        {/* Total */}
                        <td className="px-6 py-4 text-white font-medium whitespace-nowrap">
                          {fmtAmount(order.totalAmount)}
                        </td>

                        {/* Status badge + dropdown */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                            <select
                              value={status}
                              disabled={updatingId === order.id}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="appearance-none bg-slate-800/80 border border-slate-700/50 text-slate-300 text-xs rounded-lg px-2 py-1.5 pr-6 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors disabled:opacity-50 cursor-pointer"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2394a3b8'%3E%3Cpath fill-rule='evenodd' d='M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z' clip-rule='evenodd'/%3E%3C/svg%3E")`,
                                backgroundPosition: "right 0.25rem center",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "1rem",
                              }}
                            >
                              {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                              ))}
                            </select>
                            {updatingId === order.id && (
                              <svg className="size-4 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                          {fmtDate(order.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setDeletingOrder(order)}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg px-3 py-1.5 transition-colors"
                          >
                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order count */}
        {!loading && orders.length > 0 && (
          <p className="text-slate-500 text-xs mt-4">
            Showing {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Order Details Slide-over / Modal */}
      {(selectedOrderId !== null || selectedOrderDetails !== null) && (
        <>
          {/* backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
            onClick={closeOrderDetails}
          />

          {/* panel */}
          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col animate-[slideInRight_0.3s_ease]">
            {/* panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
              <h2 className="text-lg font-semibold text-white">
                Order Details {selectedOrderId !== null ? fmtId(selectedOrderId) : ""}
              </h2>
              <button
                onClick={closeOrderDetails}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* content */}
            {loadingDetails ? (
              <div className="flex-1 flex items-center justify-center">
                <svg className="size-8 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : selectedOrderDetails ? (
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Customer Info */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">Name</p>
                      <p className="text-white font-medium mt-0.5">{selectedOrderDetails.customerName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Phone</p>
                      <p className="text-white font-medium mt-0.5">{selectedOrderDetails.customerPhone || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500 text-xs">Email</p>
                      <p className="text-white font-medium mt-0.5">{selectedOrderDetails.customerEmail || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-500 text-xs">Shipping Address</p>
                      <p className="text-white font-medium mt-0.5 whitespace-pre-wrap">{selectedOrderDetails.shippingAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Status & Date */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-xs">Ordered On</p>
                    <p className="text-white font-medium mt-0.5">{fmtDate(selectedOrderDetails.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs text-right mb-1">Status</p>
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${statusStyles[selectedOrderDetails.status as Status || "pending"]}`}>
                      {(selectedOrderDetails.status || "pending").toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Ordered Items */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Items Ordered</h3>
                  <div className="divide-y divide-slate-800 border border-slate-800 bg-slate-900/20 rounded-2xl overflow-hidden">
                    {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                      selectedOrderDetails.items.map((item: any) => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-900/30 transition-colors">
                          <div className="flex items-center gap-3">
                            {item.productImageUrl ? (
                              <img src={item.productImageUrl} alt={item.productName || "Product"} className="size-12 rounded-xl object-cover border border-slate-850" />
                            ) : (
                              <div className="size-12 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-650">
                                <svg className="size-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium text-sm line-clamp-1">{item.productName || "Deleted Product"}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-slate-450">
                                <span>Size: <strong className="text-slate-300">{item.size}</strong></span>
                                <span className="text-slate-600">•</span>
                                <span>Qty: <strong className="text-slate-300">{item.quantity}</strong></span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold text-sm">{fmtAmount(String(parseFloat(item.unitPrice) * item.quantity))}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{fmtAmount(item.unitPrice)} each</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-slate-500 text-sm italic">No items found in this order.</div>
                    )}
                  </div>
                </div>

                {/* Total Summary */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-inner">
                  <span className="text-sm font-semibold text-slate-300">Total Amount</span>
                  <span className="text-xl font-bold text-amber-400">{fmtAmount(selectedOrderDetails.totalAmount)}</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No order data found.</div>
            )}

            {/* panel footer */}
            <div className="border-t border-slate-800/60 px-6 py-4 flex items-center justify-end">
              <button
                onClick={closeOrderDetails}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Delete confirmation modal */}
      {deletingOrder && (
        <DeleteModal
          order={deletingOrder}
          onCancel={() => setDeletingOrder(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
