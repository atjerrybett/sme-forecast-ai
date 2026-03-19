'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { Moon, Sun, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { isLoading, user } = useProtectedRoute();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col border-r border-gray-200 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 transition-colors duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <Logo href="/dashboard" showText={sidebarOpen} compact={!sidebarOpen} className="text-blue-600" />
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2 px-4 py-6">
          <NavLink
            href="/dashboard"
            icon="📊"
            label="Dashboard"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/datasets"
            icon="📁"
            label="Datasets"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/upload"
            icon="📤"
            label="Upload Data"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/transactions"
            icon="📋"
            label="Transactions"
            sidebarOpen={sidebarOpen}
          />
          <NavLink
            href="/dashboard/forecast"
            icon="🔮"
            label="Forecast"
            sidebarOpen={sidebarOpen}
          />
        </nav>

        {/* User Menu */}
        <div className="border-t border-gray-200 p-4">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex w-full items-center gap-3 rounded-lg bg-gray-100 p-3 hover:bg-gray-200"
            >
              <div className="h-8 w-8 rounded-full bg-blue-600 text-sm font-bold text-white flex items-center justify-center">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 text-left">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {user?.email}
                  </p>
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && sidebarOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  {theme === 'dark' ? (
                    <><Sun className="w-4 h-4" /> Light Mode</>
                  ) : (
                    <><Moon className="w-4 h-4" /> Dark Mode</>
                  )}
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  icon: string;
  label: string;
  sidebarOpen: boolean;
}

function NavLink({ href, icon, label, sidebarOpen }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(href);

  return (
    <Link
      href={href}
      title={!sidebarOpen ? label : undefined}
      className={`flex items-center gap-3 rounded-lg px-4 py-2 transition-colors ${
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-blue-300'
          : 'text-slate-800 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
      }`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="text-xl">{icon}</span>
      {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}
