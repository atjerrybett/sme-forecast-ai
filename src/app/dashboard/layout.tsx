'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useProtectedRoute } from '@/lib/useProtectedRoute';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
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
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col border-r border-gray-200 bg-white transition-all duration-300`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-blue-600">
            {sidebarOpen && 'ForecastFlow'}
            {!sidebarOpen && 'FF'}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1 hover:bg-gray-100"
          >
            {sidebarOpen ? '←' : '→'}
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
                  onClick={handleSignOut}
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
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
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-4 py-2 text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
    >
      <span className="text-xl">{icon}</span>
      {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}
