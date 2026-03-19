'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
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
  actual?: number;
  forecast?: number;
  forecastBest?: number;
  forecastWhatIf?: number;
  lower?: number;
  upper?: number;
}

interface ForecastApiResponse {
  forecast: Array<{ date: string; point: number; lower: number; upper: number }>;
  explanation: string;
  model: string;
  scenario?: 'expected' | 'best' | 'worst';
  whatIf?: { salesPct: number; expensesPct: number };
}

interface ForecastRun {
  id: string;
  created_at: string;
  scenario: 'expected' | 'best' | 'worst';
  sales_pct: number;
  expenses_pct: number;
  model: string;
  explanation: string;
  forecast: Array<{ date: string; point: number; lower: number; upper: number }>;
}

type MonthlyData = { category: string; income: number; expense: number; net: number }[];

export default function ForecastPage() {
  const { isLoading, user } = useProtectedRoute();
  const [chartData, setChartData] = useState<ForecastDataPoint[]>([]);
  const [baseForecast, setBaseForecast] = useState<ForecastApiResponse['forecast']>([]);
  const [dailyMap, setDailyMap] = useState<Map<string, number>>(new Map());
  const [monthlyData, setMonthlyData] = useState<MonthlyData>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [forecastModel, setForecastModel] = useState<string | null>(null);
  const [scenario, setScenario] = useState<'expected' | 'best' | 'worst'>('expected');
  const [whatIfSalesPct, setWhatIfSalesPct] = useState(0);
  const [whatIfExpensesPct, setWhatIfExpensesPct] = useState(0);

  // Persist user scenario + what-if choices across refreshes
  useEffect(() => {
    const storedScenario = window.localStorage.getItem('forecastScenario');
    const storedSales = window.localStorage.getItem('forecastWhatIfSales');
    const storedExpenses = window.localStorage.getItem('forecastWhatIfExpenses');

    if (storedScenario === 'best' || storedScenario === 'worst' || storedScenario === 'expected') {
      setScenario(storedScenario);
    }
    if (storedSales !== null) setWhatIfSalesPct(Number(storedSales));
    if (storedExpenses !== null) setWhatIfExpensesPct(Number(storedExpenses));
  }, []);

  useEffect(() => {
    window.localStorage.setItem('forecastScenario', scenario);
  }, [scenario]);

  useEffect(() => {
    window.localStorage.setItem('forecastWhatIfSales', String(whatIfSalesPct));
  }, [whatIfSalesPct]);

  useEffect(() => {
    window.localStorage.setItem('forecastWhatIfExpenses', String(whatIfExpensesPct));
  }, [whatIfExpensesPct]);
  const [shapInsights, setShapInsights] = useState<string | null>(null);
  const [shapImportance, setShapImportance] = useState<Array<{ feature: string; importance: number }>>([]);
  const [shapFeatureExplanations, setShapFeatureExplanations] = useState<
    Array<{ feature: string; importance: number; description: string }>
  >([]);
  const [forecastHistory, setForecastHistory] = useState<ForecastRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyScenarioMultiplier = useCallback(
    (value: number) => {
      const scenarioFactor = scenario === 'best' ? 1.15 : scenario === 'worst' ? 0.85 : 1;
      return value * scenarioFactor;
    },
    [scenario]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currencyTooltipFormatter = (value: any) =>
    typeof value === 'number' ? formatCurrency(value) : `${value ?? ''}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapTooltipFormatter = (value: any) =>
    typeof value === 'number' ? value.toFixed(3) : '';
  const applyWhatIfMultiplier = useCallback(
    (value: number) => {
      const multiplier = 1 + (whatIfSalesPct - whatIfExpensesPct) / 100;
      return value * Math.max(0.1, Math.min(2, multiplier));
    },
    [whatIfExpensesPct, whatIfSalesPct]
  );

  const buildChartData = useCallback(
    (
      dailyMap: Map<string, number>,
      baseForecastData: ForecastApiResponse['forecast']
    ) => {
      const forecastMap = new Map(baseForecastData.map((f) => [f.date, f]));

      const actualDates = Array.from(dailyMap.keys());
      const forecastDates = baseForecastData.map((f) => f.date);
      const allDates = Array.from(new Set([...actualDates, ...forecastDates])).sort();

      return allDates.map((date) => {
        const actual = dailyMap.get(date);
        const f = forecastMap.get(date);
        const base = f?.point;
        const best = base != null ? applyScenarioMultiplier(base) : undefined;
        const whatIf = base != null ? applyWhatIfMultiplier(best ?? base ?? 0) : undefined;

        return {
          date,
          actual,
          forecast: base,
          forecastBest: best,
          forecastWhatIf: whatIf,
          lower: f?.lower,
          upper: f?.upper,
        };
      });
    },
    [applyScenarioMultiplier, applyWhatIfMultiplier]
  );
  const generateForecast = async (data: Transaction[]) => {
    setLoading(true);
    // Map financial transactions to daily net cash
    const dailyMap = new Map<string, number>();
    data.forEach((t) => {
      const dateKey = new Date(t.date).toISOString().split('T')[0];
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + t.amount);
    });


    // Create monthly summary for breakdown widgets
    const monthlyAmounts: { [key: string]: number } = {};
    data.forEach((t) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyAmounts[monthKey] = (monthlyAmounts[monthKey] || 0) + t.amount;
    });

    const monthly = Object.entries(monthlyAmounts).map(([category, total]) => ({
      category,
      income: total > 0 ? total : 0,
      expense: total < 0 ? Math.abs(total) : 0,
      net: total,
    }));

    setMonthlyData(monthly);
      setDailyMap(dailyMap);
    // Try calling the Hugging Face forecast API
    try {
      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;
      if (!token) throw new Error('Missing authentication token');

      const res = await fetch('/api/forecast', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const payload = (await res.json()) as ForecastApiResponse & { error?: string };
      if (!res.ok || payload.error) {
        throw new Error(payload.error || 'Forecast API failed');
      }

      setForecastModel(payload.model);
      setInsights(payload.explanation);
      setBaseForecast(payload.forecast);

      if (payload.scenario) setScenario(payload.scenario);
      if (payload.whatIf) {
        setWhatIfSalesPct(payload.whatIf.salesPct ?? 0);
        setWhatIfExpensesPct(payload.whatIf.expensesPct ?? 0);
      }

      // Reset history selection when running a new forecast
      setSelectedRunId(null);

      // Call SHAP explainability endpoint
      const shapRes = await fetch('/api/shap', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const shapJson = await shapRes.json();
      if (shapRes.ok) {
        setShapImportance(shapJson.feature_importance ?? []);
        setShapFeatureExplanations(shapJson.feature_explanations ?? []);
        setShapInsights(shapJson.explanation ?? null);
      } else {
        console.warn('SHAP explainability failed', shapJson);
        setShapInsights('Could not compute explainability for your forecast.');
      }

      setChartData(buildChartData(dailyMap, payload.forecast));
      setError(null);

      // Refresh history after a successful run
      fetchForecastHistory();
    } catch (err) {
      console.error('Forecast API error', err);
      setError((err as Error)?.message ?? 'Unable to generate forecast');

      // Fallback: keep simple trend chart
      const sortedMonths = Object.keys(monthlyAmounts).sort();
      const amounts = sortedMonths.map((m) => monthlyAmounts[m]);
      const forecast = generateSimpleForecast(amounts);

      const chart = sortedMonths.map((month) => ({
        date: formatMonthLabel(month),
        actual: monthlyAmounts[month],
        forecast: forecast[sortedMonths.indexOf(month)],
      }));

      setChartData(chart);
      setInsights('Unable to generate advanced forecast; using simple trend estimation.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunForecast = async () => {
    if (allTransactions.length === 0) return;
    await generateForecast(allTransactions);
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
          setAllTransactions(allTransactions);
          await generateForecast(allTransactions);
        }

        // Load history for the user
        await fetchForecastHistory();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndAnalyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchForecastHistory = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data?.session?.access_token;
      if (!token) return;

      const res = await fetch('/api/forecast/history', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.runs)) {
        setForecastHistory(json.runs);
      }
    } catch (err) {
      console.warn('Unable to fetch forecast history', err);
    }
  };

  useEffect(() => {
    if (!baseForecast.length || dailyMap.size === 0) return;
    setChartData(buildChartData(dailyMap, baseForecast));
  }, [baseForecast, dailyMap, scenario, whatIfSalesPct, whatIfExpensesPct, buildChartData]);

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

  const formatMonthLabel = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  if (isLoading || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Financial Forecast</h1>
        <p className="mt-2 text-gray-600">
          AI-powered insights and predictions based on your transaction data
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Forecast error:</p>
          <p>{error}</p>
        </div>
      )}

      {chartData.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600">No data available yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Upload transaction data to see forecasts
          </p>
        </div>
      ) : (
        <>
          {/* Scenario + What-If Controls */}
          <div className="mb-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Scenario</h3>
                  <p className="mt-1 text-xs text-gray-500">Choose a forecast scenario.</p>
                </div>
                <button
                  type="button"
                  onClick={handleRunForecast}
                  className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Run forecast
                </button>
              </div>
              <select
                value={scenario}
                onChange={(event) =>
                  setScenario(event.target.value as 'expected' | 'best' | 'worst')
                }
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="expected">Expected (base)</option>
                <option value="best">Best case (+15%)</option>
                <option value="worst">Worst case (-15%)</option>
              </select>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-900">What-if: Sales</h3>
              <p className="mt-1 text-xs text-gray-500">Adjust your sales assumption.</p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={whatIfSalesPct}
                  onChange={(event) => setWhatIfSalesPct(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
                />
                <span className="w-14 text-right text-sm font-medium text-slate-700">
                  {whatIfSalesPct}%
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-900">What-if: Expenses</h3>
              <p className="mt-1 text-xs text-gray-500">Adjust your expense assumption.</p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={whatIfExpensesPct}
                  onChange={(event) => setWhatIfExpensesPct(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200"
                />
                <span className="w-14 text-right text-sm font-medium text-slate-700">
                  {whatIfExpensesPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Insights Box */}
          {insights && (
            <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6 whitespace-pre-line">
              <p className="text-sm text-blue-900 font-mono">{insights}</p>
            </div>
          )}

          {/* Forecast history */}
          {forecastHistory.length > 0 && (
            <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Forecast history</h2>
                <button
                  type="button"
                  onClick={fetchForecastHistory}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {forecastHistory.map((run) => (
                  <button
                    key={run.id}
                    type="button"
                    onClick={() => {
                      setSelectedRunId(run.id);
                      setForecastModel(run.model);
                      setInsights(run.explanation);
                      setScenario(run.scenario);
                      setWhatIfSalesPct(run.sales_pct);
                      setWhatIfExpensesPct(run.expenses_pct);
                      setBaseForecast(run.forecast);
                      setChartData(buildChartData(dailyMap, run.forecast));
                    }}
                    className={`text-left rounded-lg border p-4 transition hover:border-blue-400 ${
                      selectedRunId === run.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-900">{new Date(run.created_at).toLocaleString()}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {run.scenario}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      Sales: {run.sales_pct}% · Expenses: {run.expenses_pct}% · Model: {run.model}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SHAP Explainability */}
          {shapInsights && (
            <div className="mb-8 rounded-lg border border-indigo-200 bg-indigo-50 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-indigo-900">
                  Forecast explainability (SHAP)
                </h2>
                <p className="text-sm text-indigo-700">
                  See which features most influence the model’s predictions.
                </p>
              </div>
              <p className="mt-3 text-sm text-indigo-900">{shapInsights}</p>

              {shapImportance.length > 0 && (
                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        layout="vertical"
                        data={shapImportance.slice(0, 8)}
                        margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis
                          dataKey="feature"
                          type="category"
                          width={120}
                          tick={{ fill: '#1e3a8a', fontSize: 12 }}
                        />
                        <Tooltip formatter={shapTooltipFormatter} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                        <Bar dataKey="importance" fill="#4f46e5" radius={[4, 4, 4, 4]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="mt-4 text-xs text-indigo-700">
                      Values represent average absolute SHAP importance; higher means stronger influence on forecasts.
                    </p>
                  </div>

                  {shapFeatureExplanations.length > 0 && (
                    <div className="rounded-lg border border-indigo-100 bg-white p-4">
                      <h3 className="text-sm font-semibold text-indigo-900">Feature insights</h3>
                      <ul className="mt-3 space-y-3">
                        {shapFeatureExplanations.map((item) => (
                          <li key={item.feature} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-800">
                                {item.feature}
                              </span>
                              <span className="text-xs font-semibold text-indigo-700">
                                {item.importance.toFixed(3)}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-600">{item.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Line Chart - Trend */}
          <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Monthly Trend & Forecast</h2>
              {forecastModel && (
                <span className="text-xs text-gray-500">Model: {forecastModel}</span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
                <Tooltip
                  formatter={currencyTooltipFormatter}
                  labelFormatter={(label: unknown) => `Date: ${label}`}
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
                  name="Base Forecast"
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecastBest"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  name="Best-case"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecastWhatIf"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="2 2"
                  name="What-if"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="upper"
                  stroke="#f97316"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  name="Upper 80%"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="lower"
                  stroke="#f97316"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  name="Lower 80%"
                  dot={false}
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
  </div>
  );
}
