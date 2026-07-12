"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AccountSwitcher } from "@/components/ui/AccountSwitcher";
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Clock,
  Target,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  FolderOpen,
  Tag,
} from "lucide-react";
import { CustomConfirmModal } from "@/components/ui/CustomConfirmModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen]   = useState(false);
  const [isDarkMode, setIsDarkMode]       = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved === "light") {
        document.documentElement.classList.remove("dark");
        setIsDarkMode(false);
      } else {
        document.documentElement.classList.add("dark");
        setIsDarkMode(true);
      }
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[hsl(var(--background))]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
            Authenticating...
          </span>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard",          href: "/",             icon: LayoutDashboard },
    { name: "Wallets & Accounts", href: "/accounts",     icon: Wallet          },
    { name: "Transactions",       href: "/transactions", icon: FileText        },
    { name: "Recurring",          href: "/recurring",    icon: Clock           },
    { name: "Savings Goals",      href: "/savings",      icon: Target          },
    { name: "Categories",         href: "/categories",   icon: FolderOpen      },
    { name: "Tags",               href: "/tags",         icon: Tag             },
    { name: "Profile",            href: "/profile",      icon: UserIcon        },
  ];

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const avatarInitial = user?.fullName?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-x-hidden">

      {/* ─── Mobile Top Header ──────────────────────────────────────── */}
      <header className="md:hidden w-full h-14 fixed top-0 left-0 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2.5">
          {/* Logo badge */}
          <div className="h-7 w-7 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
            <span className="text-[hsl(var(--primary-foreground))] font-black text-[11px]">SF</span>
          </div>
          <span className="font-extrabold text-sm tracking-tight">ST-Finance</span>
        </div>
        <div className="flex items-center gap-2">
          <AccountSwitcher accountName={user?.fullName?.split(" ")[0] ?? "Account"} />
          <button
            id="mobile-theme-toggle"
            onClick={toggleTheme}
            className="ds-btn-icon h-8 w-8"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button
            id="mobile-menu-toggle"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="ds-btn-icon h-8 w-8"
          >
            {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* ─── Desktop Sidebar ────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-screen fixed top-0 left-0 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] transition-all duration-200 z-30 ${
          isSidebarCollapsed ? "w-[60px]" : "w-[220px]"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 flex items-center px-3.5 border-b border-[hsl(var(--border))] justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 shrink-0 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
              <span className="text-[hsl(var(--primary-foreground))] font-black text-[11px]">SF</span>
            </div>
            {!isSidebarCollapsed && (
              <span className="font-extrabold text-sm tracking-tight truncate">ST-Finance</span>
            )}
          </div>
          {!isSidebarCollapsed ? (
            <button
              id="sidebar-collapse-btn"
              onClick={() => setIsSidebarCollapsed(true)}
              className="ds-btn-icon h-6 w-6 shrink-0"
              title="Collapse"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              id="sidebar-expand-btn"
              onClick={() => setIsSidebarCollapsed(false)}
              className="absolute top-4 right-[-11px] h-6 w-6 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-center hover:border-[hsl(var(--primary))] transition-all"
              title="Expand"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                  isActive
                    ? "ds-nav-pill ds-nav-pill-active"
                    : "ds-nav-pill"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive
                      ? "text-[hsl(var(--primary))]"
                      : "text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))]"
                  }`}
                />
                {!isSidebarCollapsed && (
                  <span className="text-xs font-medium">{item.name}</span>
                )}
                {/* Tooltip for collapsed state */}
                {isSidebarCollapsed && (
                  <div className="pointer-events-none absolute left-12 scale-0 group-hover:scale-100 origin-left transition-transform duration-100 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-2.5 py-1.5 text-[11px] font-semibold whitespace-nowrap shadow-lg z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Theme + User */}
        <div className="p-3 border-t border-[hsl(var(--border))] space-y-2">
          {/* Theme Toggle */}
          {!isSidebarCollapsed ? (
            <button
              id="desktop-theme-toggle"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/0.4)] text-[11px] font-semibold transition-all"
            >
              <span className="flex items-center gap-1.5">
                {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                Appearance
              </span>
              <span className="text-[10px]">{isDarkMode ? "Dark" : "Light"}</span>
            </button>
          ) : (
            <button
              id="desktop-theme-toggle-collapsed"
              onClick={toggleTheme}
              className="mx-auto ds-btn-icon h-8 w-8"
              title="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          {/* User Row */}
          <div
            className={`flex items-center gap-2.5 ${
              isSidebarCollapsed ? "justify-center" : "px-2 py-2 rounded-lg bg-[hsl(var(--secondary)/0.5)]"
            }`}
          >
            <div className="h-7 w-7 shrink-0 rounded-full bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--primary)/0.3)] flex items-center justify-center font-bold text-xs text-[hsl(var(--primary))]">
              {avatarInitial}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold truncate">{user?.fullName}</p>
                <p className="text-[9px] text-[hsl(var(--muted-foreground))] truncate">{user?.email}</p>
              </div>
            )}
            {!isSidebarCollapsed && (
              <button
                id="sidebar-logout-btn"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.08)] transition-all"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {isSidebarCollapsed && (
            <button
              id="sidebar-logout-collapsed"
              onClick={handleLogout}
              className="mx-auto flex items-center justify-center h-8 w-8 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.08)] transition-all"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>

      {/* ─── Mobile Drawer ──────────────────────────────────────────── */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="relative flex flex-col w-64 h-full bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] p-4 z-50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
                  <span className="text-[hsl(var(--primary-foreground))] font-black text-[11px]">SF</span>
                </div>
                <span className="font-extrabold text-sm">ST-Finance</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="ds-btn-icon h-7 w-7"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-grow space-y-0.5">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`ds-nav-pill ${isActive ? "ds-nav-pill-active" : ""}`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-[hsl(var(--primary))]" : ""
                      }`}
                    />
                    <span className="text-xs font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-[hsl(var(--border))] pt-4 space-y-3">
              <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-[hsl(var(--secondary)/0.5)]">
                <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--primary)/0.3)] flex items-center justify-center font-bold text-xs text-[hsl(var(--primary))]">
                  {avatarInitial}
                </div>
                <div>
                  <p className="text-xs font-bold">{user?.fullName}</p>
                  <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-lg border border-[hsl(var(--destructive)/0.3)] text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.08)] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ─── Main Content ────────────────────────────────────────────── */}
      <main
        className={`flex-1 min-h-screen pt-16 md:pt-0 px-4 pb-12 transition-all duration-200 ${
          isSidebarCollapsed ? "md:pl-[76px]" : "md:pl-[236px]"
        }`}
      >
        <div className="max-w-7xl mx-auto w-full py-6">{children}</div>
      </main>

      {/* Logout Confirmation Modal */}
      <CustomConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of your financial workspace?"
        confirmLabel="Sign Out"
        cancelLabel="Stay"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          router.push("/login");
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
