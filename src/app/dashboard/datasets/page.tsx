'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { BarChart3, TrendingUp, FileText, Calendar } from 'lucide-react';

interface DatasetWithStats {
  id: string;
  name: string;
  uploaded_at: string;
  row_count: number;
  totalAmount: number;
  income: number;
  expenses: number;
  netProfit: number;
  transactionCount: number;
}

export default function DatasetsPage() {
  const { isLoading, user } = useProtectedRoute();
  const [datasets, setDatasets] = useState<DatasetWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchDatasets = async () => {
      try {
        // Get user's datasets
        const { data: userDatasets, error: datasetsError } = await supabase
          .from('datasets')
          .select('*')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false });

        if (datasetsError) throw datasetsError;

        // Fetch stats for each dataset
        const datasetWithStats: DatasetWithStats[] = await Promise.all(
          (userDatasets || []).map(async (dataset) => {
            const { data: transactions, error: txError } = await supabase
              .from('transactions')
              .select('amount')
              .eq('dataset_id', dataset.id);

            if (txError) throw txError;

            const txs = transactions || [];
            const income = txs.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
            const expenses = Math.abs(txs.filter(t => t.amount < 0).reduce((a, b) => a + b.amount, 0));

            return {
              id: dataset.id,
              name: dataset.name,
              uploaded_at: dataset.uploaded_at,
              row_count: dataset.row_count,
              totalAmount: income - expenses,
              income,
              expenses,
              netProfit: income - expenses,
              transactionCount: txs.length,
            };
          })
        );

        setDatasets(datasetWithStats);
      } catch (error) {
        console.error('Error fetching datasets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatasets();
  }, [user]);

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
        <h1 className="text-4xl font-bold text-gray-900">My Datasets</h1>
        <p className="mt-2 text-gray-600">
          Manage and analyze your uploaded financial datasets
        </p>
      </div>

      {/* Upload Button */}
      <div className="mb-8">
        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          <span>+ Upload New Dataset</span>
        </Link>
      </div>

      {/* No Data State */}
      {datasets.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900">No datasets yet</h3>
          <p className="mt-2 text-gray-600">
            Upload your first CSV file to get started with financial analysis
          </p>
          <Link
            href="/dashboard/upload"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Upload Dataset
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold truncate">{dataset.name}</h3>
                    <div className="flex items-center gap-2 mt-2 text-blue-100 text-sm">
                      <Calendar className="w-4 h-4" />
                      {formatDate(dataset.uploaded_at)}
                    </div>
                  </div>
                  <BarChart3 className="w-8 h-8 opacity-50" />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                {/* Transaction Count */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Transactions</span>
                  <span className="text-2xl font-bold text-gray-900">{dataset.transactionCount}</span>
                </div>

                {/* Net Profit */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Net Profit</span>
                  <span className={`text-2xl font-bold ${dataset.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dataset.netProfit)}
                  </span>
                </div>

                {/* Income & Expenses */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Income</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(dataset.income)}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Expenses</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(dataset.expenses)}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 mb-3">Profit Margin</p>
                  <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(Math.max((dataset.netProfit / dataset.income) * 100 || 0, 0), 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mt-2">
                    {dataset.income > 0 ? ((dataset.netProfit / dataset.income) * 100).toFixed(1) : 0}%
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                  <Link
                    href={`/dashboard/transactions?dataset=${dataset.id}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                  >
                    <FileText className="w-4 h-4" />
                    View
                  </Link>
                  <Link
                    href={`/dashboard/forecast?dataset=${dataset.id}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Forecast
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
