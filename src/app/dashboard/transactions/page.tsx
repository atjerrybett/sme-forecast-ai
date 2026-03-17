'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Transaction } from '@/types';

export default function TransactionsPage() {
  const { isLoading, user } = useProtectedRoute();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      try {
        // Get user's datasets first
        const { data: userDatasets, error: datasetsError } = await supabase
          .from('datasets')
          .select('id')
          .eq('user_id', user.id);

        if (datasetsError) throw datasetsError;

        const datasetIds = userDatasets?.map(d => d.id) || [];

        // Get transactions for user's datasets
        let allTransactions: any[] = [];
        if (datasetIds.length > 0) {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .in('dataset_id', datasetIds)
            .order('date', { ascending: false });

          if (error) throw error;
          allTransactions = data || [];
        }

        setTransactions(allTransactions);

        // Extract unique categories
        const cats = [...new Set((allTransactions || []).map(t => t.category))];
        setCategories(cats.sort());
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const filteredTransactions = transactions
    .filter(t => selectedCategory === 'all' || t.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return Math.abs(b.amount) - Math.abs(a.amount);
    });

  const stats = {
    total: filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
    income: filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    expenses: filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0),
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="mt-2 text-gray-600">
          {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats Cards */}
      {filteredTransactions.length > 0 && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard
            label="Total"
            value={formatCurrency(stats.total)}
            color="blue"
          />
          <StatCard
            label="Income"
            value={formatCurrency(stats.income)}
            color="green"
          />
          <StatCard
            label="Expenses"
            value={formatCurrency(Math.abs(stats.expenses))}
            color="red"
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
            className="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="date">Date (Newest)</option>
            <option value="amount">Amount (Largest)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredTransactions.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                  Category
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {transaction.description || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-900">
                      {transaction.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right text-sm font-semibold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">No transactions yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Upload a CSV file to get started
          </p>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  color: 'blue' | 'green' | 'red';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
  };

  const textClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    red: 'text-red-900',
  };

  return (
    <div className={`rounded-lg border ${colorClasses[color]} p-4`}>
      <p className={`text-sm font-medium ${textClasses[color]}`}>{label}</p>
      <p className={`mt-2 text-2xl font-bold ${textClasses[color]}`}>{value}</p>
    </div>
  );
}
