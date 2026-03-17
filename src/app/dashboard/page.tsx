'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface DashboardStats {
  totalTransactions: number;
  totalAmount: number;
  averageTransaction: number;
  lastDataset: string | null;
}

export default function Dashboard() {
  const { isLoading, user } = useProtectedRoute();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Get user's datasets first
        const { data: userDatasets, error: datasetsError } = await supabase
          .from('datasets')
          .select('id')
          .eq('user_id', user.id);

        if (datasetsError) throw datasetsError;

        const datasetIds = userDatasets?.map(d => d.id) || [];

        // Get transaction statistics for user's datasets
        let transactions: any[] = [];
        if (datasetIds.length > 0) {
          const { data, error } = await supabase
            .from('transactions')
            .select('amount')
            .in('dataset_id', datasetIds);

          if (error) throw error;
          transactions = data || [];
        }

        const amounts = transactions.map(t => t.amount) || [];
        const total = amounts.reduce((a, b) => a + b, 0);
        const average = amounts.length > 0 ? total / amounts.length : 0;

        // Get latest dataset
        const { data: datasets } = await supabase
          .from('datasets')
          .select('name, uploaded_at')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false })
          .limit(1);

        setStats({
          totalTransactions: amounts.length,
          totalAmount: total,
          averageTransaction: average,
          lastDataset: datasets?.[0]?.name || null,
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
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to ForecastFlow</h1>
        <p className="mt-2 text-gray-600">
          {user?.email && `Logged in as ${user.email}`}
        </p>
      </div>

      {/* Quick Start */}
      {!stats?.lastDataset && (
        <div className="mb-8 rounded-lg border-l-4 border-blue-600 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900">Get Started</h2>
          <p className="mt-2 text-blue-800">
            Upload your first financial dataset to see insights and forecasts.
          </p>
          <Link
            href="/dashboard/upload"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Upload Data
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Total Transactions"
          value={stats?.totalTransactions || 0}
          icon="📊"
        />
        <StatCard
          label="Total Amount"
          value={formatCurrency(stats?.totalAmount || 0)}
          icon="💰"
          isFormatted
        />
        <StatCard
          label="Average Transaction"
          value={formatCurrency(stats?.averageTransaction || 0)}
          icon="📈"
          isFormatted
        />
        <StatCard
          label="Last Upload"
          value={stats?.lastDataset || 'No data yet'}
          icon="📅"
          isFormatted
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <ActionButton
            label="Upload Data"
            description="Add new financial data"
            href="/dashboard/upload"
            icon="📤"
          />
          <ActionButton
            label="View Transactions"
            description="Browse all records"
            href="/dashboard/transactions"
            icon="📋"
          />
          <ActionButton
            label="View Forecast"
            description="See predictions"
            href="/dashboard/forecast"
            icon="🔮"
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  isFormatted?: boolean;
}

function StatCard({ label, value, icon, isFormatted }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {typeof value === 'number' && !isFormatted ? value.toLocaleString() : value}
          </p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  description: string;
  href: string;
  icon: string;
}

function ActionButton({ label, description, href, icon }: ActionButtonProps) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
