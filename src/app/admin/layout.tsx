"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

// ─── VAPID public key (safe to expose to the client) ─────────────────────────
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

/**
 * Convert a base64url VAPID public key to the Uint8Array that
 * PushManager.subscribe() expects as applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function PushToggle() {
  const [status, setStatus] = useState<"loading" | "subscribed" | "unsubscribed" | "unsupported">("loading");

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setStatus("unsupported");
      return;
    }

    async function initPush() {
      try {
        if (!VAPID_PUBLIC_KEY) {
          setStatus("unsupported");
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        await navigator.serviceWorker.ready;

        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          setStatus("subscribed");
        } else {
          // Auto-subscribe if not already, to satisfy the initial requirement
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            const newSub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
            });
            const serialized = newSub.toJSON();
            const res = await fetch("/api/admin/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                endpoint: serialized.endpoint,
                keys: serialized.keys,
              }),
            });
            if (!res.ok) {
              await newSub.unsubscribe();
              throw new Error("Backend failed to save subscription");
            }
            setStatus("subscribed");
          } else {
            setStatus("unsubscribed");
          }
        }
      } catch (err) {
        console.warn("[Push] Failed to init push:", err);
        setStatus("unsubscribed");
      }
    }

    initPush();
  }, []);

  async function handleToggle() {
    if (status === "subscribed") {
      setStatus("loading");
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const sub = await registration?.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          await fetch("/api/admin/push/unsubscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
        }
        setStatus("unsubscribed");
      } catch (err) {
        console.warn("[Push] Unsubscribe failed:", err);
        setStatus("subscribed");
      }
    } else if (status === "unsubscribed") {
      setStatus("loading");
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus("unsubscribed");
          alert("Notification permission denied. Please allow it in browser settings.");
          return;
        }
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) throw new Error("No SW registration");

        const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        const newSub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });
        const serialized = newSub.toJSON();
        const res = await fetch("/api/admin/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: serialized.endpoint,
            keys: serialized.keys,
          }),
        });
        if (!res.ok) {
          await newSub.unsubscribe();
          throw new Error("Backend failed to save subscription");
        }
        setStatus("subscribed");
      } catch (err) {
        console.warn("[Push] Subscribe failed:", err);
        setStatus("unsubscribed");
      }
    }
  }

  if (status === "unsupported") return null;

  return (
    <div className="px-3 py-2 mt-auto">
      <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50">
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 ${status === "subscribed" ? "text-amber-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <span className="text-xs font-medium text-slate-300">Push Alerts</span>
        </div>
        {status === "loading" ? (
          <span className="text-[10px] text-slate-500 font-medium">WAIT...</span>
        ) : (
          <button
            onClick={handleToggle}
            className={`text-[10px] px-2 py-1 rounded-md font-bold tracking-widest transition-colors ${
              status === "subscribed" 
                ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30" 
                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300"
            }`}
          >
            {status === "subscribed" ? "ON" : "OFF"}
          </button>
        )}
      </div>
    </div>
  );
}

const NAV_ITEMS = [
  {
    label: "Products",
    href: "/admin/products",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
    } catch {
      // ignore
    }
    window.location.href = "/admin/login";
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-slate-950 border-r border-slate-800/60
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-800/60">
          <div className="p-1.5 bg-slate-800/40 rounded-xl">
            <svg className="h-7 w-7" viewBox="0 0 48 48" fill="none">
              <defs>
                <linearGradient id="sidebar-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
              <path d="M24 2L42 12V36L24 46L6 36V12L24 2Z" stroke="url(#sidebar-gold)" strokeWidth="2" strokeLinejoin="round" fill="none" />
              <path d="M16 30V22L20 25L24 18L28 25L32 22V30H16Z" fill="url(#sidebar-gold)" />
              <path d="M14 36L24 29L34 36" stroke="url(#sidebar-gold)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">Noble Legacy</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Admin</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                  }
                `}
              >
                {item.icon}
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Push Notification Toggle (auto-pushes to bottom with mt-auto) */}
        <PushToggle />

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-800/60">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition-all duration-150 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login page should not render the sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div dir="ltr" className="flex min-h-screen bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/60 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-white">Noble Legacy</p>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
