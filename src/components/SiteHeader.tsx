'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Logo } from '@/components/Logo';
import { Menu, X, Moon, Sun, LogOut } from 'lucide-react';

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    init();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => data?.subscription?.unsubscribe();
  }, []);

  const navLinks = useMemo(
    () => [
      { label: 'Home', href: '/' },
      { label: 'Dashboard', href: '/dashboard', authOnly: true },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Features', href: '/#features' },
    ],
    []
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const currentTheme = resolvedTheme || theme || 'light';
  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  const showDashboard = !!session?.user;

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-20 border-b border-slate-900/10 bg-white backdrop-blur-xl transition-colors duration-300 dark:bg-slate-950">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Logo className="text-slate-900 dark:text-white" />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              AI Forecasting for SMEs
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map(({ label, href, authOnly }) => {
            if (authOnly && !showDashboard) return null;
            const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={classNames(
                  'rounded-md px-3 py-2 text-sm font-medium transition',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-slate-700 shadow-sm transition-colors duration-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
            aria-label="Toggle theme"
          >
            {currentTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {session?.user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {session.user.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
              >
                <LogOut className="mr-2 inline h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/auth/signin"
                className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                Get started
              </Link>
            </div>
          )}

          <button
            type="button"
            className="inline-flex items-center rounded-lg border border-slate-200 bg-white/70 p-2 text-slate-600 shadow-sm transition hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white/95 px-6 py-4 pb-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90 md:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks.map(({ label, href, authOnly }) => {
              if (authOnly && !showDashboard) return null;
              const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={classNames(
                    'rounded-md px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 flex flex-col gap-2">
            {session?.user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  onClick={() => setMobileOpen(false)}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
