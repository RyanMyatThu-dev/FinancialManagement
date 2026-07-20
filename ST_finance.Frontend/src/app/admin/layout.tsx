"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminGuard } from "@/components/AdminGuard";
import { useAuth } from "@/context/AuthContext";
import { 
  Users, 
  ShieldCheck, 
  MessageSquareText, 
  HelpCircle, 
  ArrowLeft, 
  LogOut,
  LayoutDashboard
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: "User Control",
      path: "/admin/users",
      icon: Users,
    },
    {
      name: "RBAC Settings",
      path: "/admin/rbac",
      icon: ShieldCheck,
    },
    {
      name: "User Reports",
      path: "/admin/reports",
      icon: MessageSquareText,
    },
    {
      name: "Operations Help",
      path: "/admin/support",
      icon: HelpCircle,
    },
  ];

  return (
    <AdminGuard>
      <div className="flex h-screen bg-zinc-950 text-zinc-50 antialiased overflow-hidden font-sans">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-zinc-800 bg-zinc-900/50 backdrop-blur flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-zinc-850 gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                A
              </div>
              <div>
                <h1 className="font-semibold tracking-wide text-zinc-100">ST-Finance</h1>
                <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Admin Portal</p>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive 
                        ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-400"
                    }`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer User Info */}
          <div className="p-4 border-t border-zinc-850 bg-zinc-900/20 space-y-2">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-indigo-400 text-sm">
                {user?.fullName?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-zinc-200 truncate">{user?.fullName}</p>
                <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>
            
            <div className="pt-2 border-t border-zinc-850/60 flex flex-col gap-1">
              <Link
                href="/"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Student Workspace
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/10 transition-colors w-full text-left"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          {/* Header */}
          <header className="h-16 border-b border-zinc-850 px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Pages</span>
              <span className="text-xs text-zinc-600">/</span>
              <span className="text-xs text-zinc-300 font-medium capitalize">
                {pathname.split("/").pop()?.replace("-", " ")}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                System Active
              </div>
            </div>
          </header>

          {/* Subpage Content */}
          <div className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
