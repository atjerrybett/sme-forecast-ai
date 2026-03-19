'use client';

import { useEffect, useState } from 'react';

type EconomicData = {
  usdKes: number;
  inflationYoY: number;
  gdpGrowthYoY?: number | null;
  realInterestRate?: number | null;
  updatedAt: string;
  source: 'cache' | 'live';
};

export function EconomicWidget() {
  const [data, setData] = useState<EconomicData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/economic');
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load economic data');
        setData(json);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white/60 p-6 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-sm text-gray-600 dark:text-slate-300">Loading Kenyan economic data…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
        <p>Unable to load economic indicators.</p>
        {error && <p className="mt-2 text-xs">{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Kenyan economic snapshot</p>
          <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">1 USD = {data.usdKes.toFixed(2)} KES</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">Inflation (YoY) {data.inflationYoY.toFixed(1)}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Updated {new Date(data.updatedAt).toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Source: {data.source}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">GDP growth (YoY)</p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            {data.gdpGrowthYoY != null ? `${data.gdpGrowthYoY.toFixed(1)}%` : 'N/A'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">World Bank</p>
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Real interest rate</p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            {data.realInterestRate != null ? `${data.realInterestRate.toFixed(1)}%` : 'N/A'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">World Bank</p>
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inflation (YoY)</p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{data.inflationYoY.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">World Bank</p>
        </div>

        <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">USD / KES</p>
          <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{data.usdKes.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ExchangeRate-API</p>
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        These indicators are refreshed every 10 minutes.
      </div>
    </div>
  );
}
