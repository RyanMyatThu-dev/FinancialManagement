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
      <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased overflow-hidden font-sans">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-[hsl(var(--border))] gap-3">
              <div className="h-8 w-8 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] flex items-center justify-center font-bold shadow-lg shadow-[hsl(var(--primary)/0.25)]">
                A
              </div>
              <div>
                <h1 className="font-semibold tracking-wide text-[hsl(var(--foreground))]">ST-Finance</h1>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wider">Admin Portal</p>
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
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group border ${
                      isActive 
                        ? "bg-[hsl(var(--primary)/0.08)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/0.2)]" 
                        : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent)/0.5)] border-transparent"
                    }`}
                  >
                    <Icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]"
                    }`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer User Info */}
          <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] space-y-2">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="h-9 w-9 rounded-full bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] flex items-center justify-center font-bold text-[hsl(var(--primary))] text-sm">
                {user?.fullName?.charAt(0).toUpperCase() || "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">{user?.fullName}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{user?.email}</p>
              </div>
            </div>
            
            <div className="pt-2 border-t border-[hsl(var(--border))] flex flex-col gap-1">
              <Link
                href="/"
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/0.5)] transition-colors"
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
        <main className="flex-1 flex flex-col overflow-hidden bg-[hsl(var(--background))]">
          {/* Header */}
          <header className="h-16 border-b border-[hsl(var(--border))] px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Pages</span>
              <span className="text-xs text-[hsl(var(--border))]">/</span>
              <span className="text-xs text-[hsl(var(--foreground))] font-medium capitalize">
                {pathname.split("/").pop()?.replace("-", " ")}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] border border-[hsl(var(--primary)/0.2)] rounded-full flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
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
