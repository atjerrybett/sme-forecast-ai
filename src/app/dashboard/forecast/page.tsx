'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProtectedRoute } from '@/lib/useProtectedRoute';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Transaction } from '@/types';

interface ForecastDataPoint {
  date: string;
  actual: number;
  forecast: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MonthlyData = any;

export default function ForecastPage() {
  const { isLoading, user } = useProtectedRoute();
  const [chartData, setChartData] = useState<ForecastDataPoint[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const analyzeData = (data: Transaction[]) => {
    // Group by month
    const monthlyAmounts: { [key: string]: number } = {};
    const months = new Set<string>();

    data.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
      monthlyAmounts[monthKey] = (monthlyAmounts[monthKey] || 0) + t.amount;
    });

    const sortedMonths = Array.from(months).sort();

    // Generate forecast (simple linear trend)
    const amounts = sortedMonths.map(m => monthlyAmounts[m]);
    const forecast = generateSimpleForecast(amounts);

    // Create chart data
    const chart = sortedMonths.map((month) => ({
      date: formatMonthLabel(month),
      actual: monthlyAmounts[month],
      forecast: forecast[sortedMonths.indexOf(month)],
    }));

    // Add future forecast
    if (sortedMonths.length > 0) {
      const lastMonth = sortedMonths[sortedMonths.length - 1];
      const nextMonth = getNextMonth(lastMonth);
      const futureAmount = forecast[forecast.length - 1] * 1.1; // Simple 10% growth estimate
      chart.push({
        date: formatMonthLabel(nextMonth),
        actual: 0,
        forecast: futureAmount,
      });
    }

    setChartData(chart);

    // Create monthly breakdown
    const categoryData: { [key: string]: { income: number; expense: number } } = {};
    data.forEach(t => {
      if (!categoryData[t.category]) {
        categoryData[t.category] = { income: 0, expense: 0 };
      }
      if (t.amount > 0) {
        categoryData[t.category].income += t.amount;
      } else {
        categoryData[t.category].expense += Math.abs(t.amount);
      }
    });

    const monthly = Object.entries(categoryData).map(([category, { income, expense }]) => ({
      category,
      income,
      expense,
      net: income - expense,
    }));

    setMonthlyData(monthly);

    // Generate insights
    generateInsights(amounts, data);
  };

  useEffect(() => {
    if (!user) return;

    const fetchAndAnalyze = async () => {
      try {
        // Get user's datasets first
        const { data: userDatasets, error: datasetsError } = await supabase
          .from('datasets')
          .select('id')
          .eq('user_id', user.id);

        if (datasetsError) throw datasetsError;

        const datasetIds = userDatasets?.map(d => d.id) || [];

        // Fetch transactions for user's datasets
        let allTransactions: Transaction[] = [];
        if (datasetIds.length > 0) {
          const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .in('dataset_id', datasetIds)
            .order('date', { ascending: true });

          if (error) throw error;
          allTransactions = data || [];
        }

        // Analyze and generate forecast
        if (allTransactions && allTransactions.length > 0) {
          analyzeData(allTransactions);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const generateSimpleForecast = (amounts: number[]): number[] => {
    if (amounts.length < 2) return amounts;

    // Simple linear regression
    const n = amounts.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = amounts.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * amounts[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return indices.map(x => intercept + slope * x);
  };

  const generateInsights = (amounts: number[], transactions: Transaction[]) => {
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const trend = amounts[amounts.length - 1] > avgAmount ? 'increasing' : 'decreasing';
    const growth = ((amounts[amounts.length - 1] - amounts[0]) / Math.abs(amounts[0])) * 100;

    const totalIncome = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = Math.abs(
      transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0)
    );

    const insights = `
📊 Financial Forecast Analysis

💹 Trend: ${trend === 'increasing' ? '📈 Growing' : '📉 Declining'}
Your financial flow is ${trend} with an average monthly amount of $${Math.abs(avgAmount).toFixed(2)}.

💰 Summary:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpense.toFixed(2)}
- Net Income: $${(totalIncome - totalExpense).toFixed(2)}

🔮 Forecast:
Based on current trends, your next month is projected to ${trend === 'increasing' ? 'continue growing' : 'stabilize'}.
Growth rate: ${growth > 0 ? '+' : ''}${growth.toFixed(1)}%

💡 Recommendation:
${
  totalExpense > totalIncome * 0.7
    ? 'Consider optimizing expenses - they represent a high portion of your income.'
    : 'Your expense ratio is healthy. Continue monitoring cash flow.'
}
    `.trim();

    setInsights(insights);
  };

  const formatMonthLabel = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const getNextMonth = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    let m = parseInt(month);
    let y = parseInt(year);

    m++;
    if (m > 12) {
      m = 1;
      y++;
    }

    return `${y}-${String(m).padStart(2, '0')}`;
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
        <h1 className="text-3xl font-bold text-gray-900">Financial Forecast</h1>
        <p className="mt-2 text-gray-600">
          AI-powered insights and predictions based on your transaction data
        </p>
      </div>

      {chartData.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">No data available yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Upload transaction data to see forecasts
          </p>
        </div>
      ) : (
        <>
          {/* Insights Box */}
          {insights && (
            <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6 whitespace-pre-line">
              <p className="text-sm text-blue-900 font-mono">{insights}</p>
            </div>
          )}

          {/* Line Chart - Trend */}
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Monthly Trend & Forecast
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => `$${value.toFixed(2)}`}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(label: any) => `Month: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Actual"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#ec4899"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Forecast"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart - Category Breakdown */}
          {monthlyData.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Category Breakdown
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
