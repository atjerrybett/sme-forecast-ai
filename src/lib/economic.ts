export type EconomicMetrics = {
  usdKes: number;
  inflationYoY: number;
  gdpGrowthYoY?: number | null;
  realInterestRate?: number | null;
  updatedAt: string;
};

// Use a free exchange rate API that does not require an API key.
// This endpoint returns a full JSON payload with rates keyed by currency code.
const EXCHANGE_RATE_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
const INFLATION_URL = 'https://api.worldbank.org/v2/country/KE/indicator/FP.CPI.TOTL.ZG?format=json&date=2018:2026&per_page=10';
const GDP_GROWTH_URL = 'https://api.worldbank.org/v2/country/KE/indicator/NY.GDP.MKTP.KD.ZG?format=json&date=2018:2026&per_page=10';
const REAL_INTEREST_URL = 'https://api.worldbank.org/v2/country/KE/indicator/FR.INR.RINR?format=json&date=2018:2026&per_page=10';

export async function fetchUsdKesRate(): Promise<number> {
  const res = await fetch(EXCHANGE_RATE_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Exchange rate API failed (${res.status})`);
  const data = await res.json();
  const rate = Number(data?.rates?.KES);
  if (!rate || Number.isNaN(rate)) {
    throw new Error(`Invalid exchange rate response: ${JSON.stringify(data)}`);
  }
  return rate;
}

export async function fetchKenyaInflationYoY(): Promise<number> {
  const res = await fetch(INFLATION_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`World Bank API failed (${res.status})`);
  const data = await res.json();

  // Data comes as [metadata, [records...]]
  const records = Array.isArray(data) ? data[1] : null;
  if (!Array.isArray(records)) throw new Error('Unexpected inflation response');

  type InflationRecord = { date?: string; value?: number | null };
  const record = (records as InflationRecord[]).find(
    (r) => typeof r.value === 'number' && r.value !== null
  );

  if (!record) throw new Error('No inflation record found');

  return Number(record.value);
}

async function fetchWorldBankIndicator(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`World Bank API failed (${res.status})`);
    const data = await res.json();
    const records = Array.isArray(data) ? data[1] : null;
    if (!Array.isArray(records)) throw new Error('Unexpected response');

    type Record = { date?: string; value?: number | null };
    const record = (records as Record[]).find(
      (r) => typeof r.value === 'number' && r.value !== null
    );

    return record ? Number(record.value) : null;
  } catch (error) {
    console.warn('World Bank indicator fetch failed', error);
    return null;
  }
}

export async function fetchKenyaGdpGrowthYoY(): Promise<number | null> {
  return fetchWorldBankIndicator(GDP_GROWTH_URL);
}

export async function fetchKenyaRealInterestRate(): Promise<number | null> {
  return fetchWorldBankIndicator(REAL_INTEREST_URL);
}
