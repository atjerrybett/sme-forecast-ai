'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { Transaction } from '@/types';
import { ArrowUpRight, ArrowDownRight, DollarSign, TrendingUp, ChevronLeft } from 'lucide-react';

export default function TransactionsPage() {
  const searchParams = useSearchParams();
  const selectedDatasetId = searchParams?.get('dataset');

  const { isLoading, user } = useProtectedRoute();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [datasets, setDatasets] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDataset, setSelectedDataset] = useState<string>(selectedDatasetId || 'all');

  const itemsPerPage = 20;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Get user's datasets
        const { data: userDatasets, error: datasetsError } = await supabase
          .from('datasets')
          .select('id, name')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false });

        if (datasetsError) throw datasetsError;
        setDatasets(userDatasets || []);

        // Determine which datasets to query
        const datasetIds = selectedDataset === 'all'
          ? (userDatasets || []).map(d => d.id)
          : [selectedDataset];

        // Get transactions
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .in('dataset_id', datasetIds)
          .order('date', { ascending: false });

        if (error) throw error;
        setTransactions((data as Transaction[]) || []);

        // Extract unique categories
        const cats = [...new Set(((data as Transaction[]) || []).map(t => t.category))].filter(Boolean);
        setCategories(cats.sort());
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, selectedDataset]);

  const filteredTransactions = transactions
    .filter(t => selectedCategory === 'all' || t.category === selectedCategory);

  const sortedTransactions = [...filteredTransactions];
  if (sortBy === 'date') {
    sortedTransactions.sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    });
  } else {
    sortedTransactions.sort((a, b) => {
      const diff = Math.abs(b.amount) - Math.abs(a.amount);
      return sortOrder === 'asc' ? -diff : diff;
    });
  }

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
    income: filteredTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    expenses: Math.abs(filteredTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)),
  };

  if (isLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-200 rounded-lg transition"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Transactions</h1>
        </div>
        <p className="text-gray-600">
          Browse and analyze all your financial transactions
        </p>
      </div>

      {/* Dataset Selector */}
      {datasets.length > 1 && (
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dataset
            </label>
            <select
              value={selectedDataset}
              onChange={(e) => {
                setSelectedDataset(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Datasets</option>
              {datasets.map(ds => (
                <option key={ds.id} value={ds.id}>
                  {ds.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {filteredTransactions.length > 0 && (
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className={`text-2xl font-bold ${stats.total >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.total)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.income)}
                </p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(stats.expenses)}
                </p>
              </div>
              <ArrowDownRight className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
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
              onChange={(e) => {
                setSortBy(e.target.value as 'date' | 'amount');
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="amount">Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as 'asc' | 'desc');
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredTransactions.length > 0 ? (
        <>
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
                {paginatedTransactions.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
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
                    <td className={`px-6 py-4 text-right text-sm font-bold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} of {sortedTransactions.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg transition ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900">No transactions found</p>
          <p className="mt-2 text-gray-600">
            Upload a CSV file to get started with your financial analysis
          </p>
          <Link
            href="/dashboard/upload"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Upload Data
          </Link>
        </div>
      )}
    </div>
  );
}
