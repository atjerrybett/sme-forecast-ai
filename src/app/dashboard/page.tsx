'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target } from 'lucide-react';
import { EconomicWidget } from '@/components/EconomicWidget';

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  averageDailyRevenue: number;
  totalTransactions: number;
  lastDataset: string | null;
  categoryBreakdown: Array<{ name: string; value: number }>;
  topExpenses: Array<{ name: string; value: number }>;
}

export default function Dashboard() {
  const { isLoading, user } = useProtectedRoute();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Get user's datasets
        const { data: userDatasets, error: datasetsError } = await supabase
          .from('datasets')
          .select('id, uploaded_at')
          .eq('user_id', user.id);

        if (datasetsError) throw datasetsError;

        const datasetIds = userDatasets?.map(d => d.id) || [];

        // Get all transactions
        interface Transaction {
          amount: number;
          category: string | null;
          date: string;
        }
        let transactions: Transaction[] = [];
        if (datasetIds.length > 0) {
          const { data, error } = await supabase
            .from('transactions')
            .select('amount, category, date')
            .in('dataset_id', datasetIds);

          if (error) throw error;
          transactions = (data as Transaction[]) || [];
        }

        // Calculate statistics
        const income = transactions.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
        const expenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((a, b) => a + b.amount, 0));
        const netProfit = income - expenses;

        // Calculate average daily revenue
        const uniqueDates = new Set(transactions.map(t => t.date));
        const avgDaily = uniqueDates.size > 0 ? income / uniqueDates.size : 0;

        // Category breakdown
        const categoryMap = new Map<string, number>();
        transactions.forEach(t => {
          const cat = t.category || 'Other';
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + Math.abs(t.amount));
        });

        const categoryBreakdown = Array.from(categoryMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        // Top expense categories
        const topExpenses = categoryBreakdown.slice(0, 5);

        // Get latest dataset
        const { data: datasets } = await supabase
          .from('datasets')
          .select('name')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false })
          .limit(1);

        setStats({
          totalIncome: income,
          totalExpenses: expenses,
          netProfit: netProfit,
          averageDailyRevenue: avgDaily,
          totalTransactions: transactions.length,
          lastDataset: datasets?.[0]?.name || null,
          categoryBreakdown,
          topExpenses,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (isLoading || loading) {
    return (
      <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <div className="grid gap-6 mb-8 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="h-6 w-40 rounded bg-gray-200 animate-pulse" />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <SkeletonAction />
          <SkeletonAction />
          <SkeletonAction />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
      {/* Header */}
      {/* Economic snapshot */}
      <div className="mb-8">
        <EconomicWidget />
      </div>

      {/* No Data State */}
      {!stats?.lastDataset && (
        <div className="mb-8 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900">Get Started</h2>
          <p className="mt-2 text-blue-800">
            Upload your first CSV file to see analytics and forecasts.
          </p>
          <Link
            href="/dashboard/upload"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition"
          >
            Upload Data
          </Link>
        </div>
      )}

      {/* Main Stats Cards */}
      {stats && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard
              label="Total Income"
              value={formatCurrency(stats.totalIncome)}
              valueNumber={stats.totalIncome}
              icon={<TrendingUp className="w-8 h-8 text-green-500" />}
              color="green"
            />
            <StatCard
              label="Total Expenses"
              value={formatCurrency(stats.totalExpenses)}
              valueNumber={stats.totalExpenses}
              icon={<TrendingDown className="w-8 h-8 text-red-500" />}
              color="red"
            />
            <StatCard
              label="Net Profit"
              value={formatCurrency(stats.netProfit)}
              valueNumber={stats.netProfit}
              icon={<DollarSign className="w-8 h-8 text-blue-500" />}
              color={stats.netProfit >= 0 ? 'blue' : 'red'}
            />
            <StatCard
              label="Avg Daily Revenue"
              value={formatCurrency(stats.averageDailyRevenue)}
              valueNumber={stats.averageDailyRevenue}
              icon={<Activity className="w-8 h-8 text-purple-500" />}
              color="purple"
            />
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 mb-8 lg:grid-cols-2">
            {/* Category Breakdown Pie Chart */}
            {stats.categoryBreakdown.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Expenses Bar Chart */}
            {stats.topExpenses.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.topExpenses.map(item => ({ category: item.name, amount: item.value }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalIncome > 0 ? ((stats.netProfit / stats.totalIncome) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-600">Last Dataset</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lastDataset || 'None'}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <ActionButton
              label="Upload Data"
              description="Add new financial transactions"
              href="/dashboard/upload"
              icon={<DollarSign className="w-6 h-6" />}
            />
            <ActionButton
              label="View Transactions"
              description="Browse and analyze records"
              href="/dashboard/transactions"
              icon={<Activity className="w-6 h-6" />}
            />
            <ActionButton
              label="View Forecast"
              description="See 90-day predictions"
              href="/dashboard/forecast"
              icon={<Target className="w-6 h-6" />}
            />
          </div>
        </>
      )}
    </div>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface StatCardProps {
  label: string;
  value: string;
  valueNumber?: number;
  formatValue?: (n: number) => string;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'purple';
}

function AnimatedNumber({
  value,
  format = (n: number) => n.toFixed(0),
  duration = 700,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(format(0));
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const startValue = 0;
    const endValue = value;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const current = startValue + (endValue - startValue) * progress;
      setDisplay(format(current));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, format, duration]);

  return <>{display}</>;
}

function StatCard({ label, value, valueNumber, formatValue, icon, color }: StatCardProps) {
  const bgColor = {
    green: 'bg-green-50',
    red: 'bg-red-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
  }[color];

  return (
    <div className={`${bgColor} rounded-lg border border-gray-200 p-6 shadow-sm transition hover:shadow-lg hover:border-blue-300`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {valueNumber != null ? (
              <AnimatedNumber value={valueNumber} format={formatValue ?? ((n) => formatCurrency(n))} />
            ) : (
              value
            )}
          </p>
        </div>
        {icon}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function ActionButton({ label, description, href, icon }: ActionButtonProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition hover:border-blue-500"
    >
      <div className="flex items-start gap-4">
        <div className="text-blue-600">{icon}</div>
        <div>
          <h4 className="font-semibold text-gray-900">{label}</h4>
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="h-32 rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-pulse" />
  );
}

function SkeletonChart() {
  return (
    <div className="h-72 rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-pulse" />
  );
}

function SkeletonStat() {
  return (
    <div className="h-20 rounded-lg bg-gray-100 p-4 shadow-sm animate-pulse" />
  );
}

function SkeletonAction() {
  return (
    <div className="h-28 rounded-lg border border-gray-200 bg-white p-6 shadow-sm animate-pulse" />
  );
}
