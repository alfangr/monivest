"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUserStore } from "@/stores/useUserStore";
import type { User } from "@/types";
import {
  Home,
  TrendingUp,
  Settings,
  Menu,
  X,
  LogOut,
  Tag,
  History,
  Users,
} from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut, user: authUser } = useAuthStore();
  const { fetchUser } = useUserStore();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    if (authUser) {
      fetchUser(authUser.id).then((user) => {
        setCurrentUser(user);
      });
    }
  }, [authUser, fetchUser]);

  const isAdmin = currentUser?.role === "admin";

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: Home,
    },
    {
      href: "/investments",
      label: "Investasi",
      icon: TrendingUp,
    },
    {
      href: "/categories",
      label: "Kategori",
      icon: Tag,
    },
    isAdmin && {
      href: "/activity-logs",
      label: "Riwayat",
      icon: History,
    },
    isAdmin && {
      href: "/users",
      label: "Pengguna",
      icon: Users,
    },
    {
      href: "/settings",
      label: "Pengaturan",
      icon: Settings,
    },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: React.ElementType }>;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Mobile menu button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 md:hidden h-10 w-10 rounded-lg border border-gray-200 bg-white shadow-sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </motion.div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-all duration-300 ease-in-out md:translate-x-0 shadow-xl md:shadow-none ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex h-16 items-center border-b border-gray-200 px-6"
        >
          <Link href="/dashboard" className="text-2xl font-bold text-gray-900">
            MoniVest
          </Link>
        </motion.div>
        <nav className="space-y-2 px-4 py-8">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-gray-900 text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-6"
        >
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl"
            onClick={() => setShowSignOutConfirm(true)}
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </Button>
        </motion.div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8"
        >
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {navItems.find((item) => item.href === pathname)?.label || "Monivest"}
            </h1>
          </div>
        </motion.header>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>

      {/* Overlay for mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sign Out Confirmation Dialog */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowSignOutConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Konfirmasi Keluar</h3>
              <p className="text-gray-600 mb-8">
                Apakah Anda yakin ingin keluar dari akun?
              </p>
              <div className="flex gap-4 justify-end">
                <Button
                  variant="outline"
                  className="h-10 px-6"
                  onClick={() => setShowSignOutConfirm(false)}
                >
                  Batal
                </Button>
                <Button
                  variant="default"
                  className="h-10 px-6 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    handleSignOut();
                    setShowSignOutConfirm(false);
                  }}
                >
                  Keluar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
