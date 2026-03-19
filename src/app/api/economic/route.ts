import { NextResponse } from 'next/server';
import {
  fetchKenyaInflationYoY,
  fetchKenyaGdpGrowthYoY,
  fetchKenyaRealInterestRate,
  fetchUsdKesRate,
} from '@/lib/economic';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

const CACHE_MAX_AGE_MS = 1000 * 60 * 10; // 10 minutes

const supabaseAdmin = createSupabaseAdmin();

async function getCachedMetrics() {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('economic_metrics')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.warn('Supabase cache read failed', error);
    return null;
  }

  return data;
}

async function upsertMetrics(usdKes: number, inflationYoY: number) {
  if (!supabaseAdmin) return;

  const { error } = await supabaseAdmin.from('economic_metrics').upsert({
    id: 'latest',
    usd_kes: usdKes,
    inflation_yoy: inflationYoY,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('Supabase cache write failed', error);
  }
}

export async function GET() {
  try {
    const cached = await getCachedMetrics();
    const now = Date.now();

    if (
      cached &&
      cached.updated_at &&
      now - new Date(cached.updated_at).getTime() < CACHE_MAX_AGE_MS
    ) {
      return NextResponse.json({
        usdKes: cached.usd_kes,
        inflationYoY: cached.inflation_yoy,
        updatedAt: cached.updated_at,
        source: 'cache',
      });
    }

    const [usdKes, inflationYoY, gdpGrowthYoY, realInterestRate] = await Promise.all([
      fetchUsdKesRate(),
      fetchKenyaInflationYoY(),
      fetchKenyaGdpGrowthYoY(),
      fetchKenyaRealInterestRate(),
    ]);

    await upsertMetrics(usdKes, inflationYoY);

    return NextResponse.json({
      usdKes,
      inflationYoY,
      gdpGrowthYoY,
      realInterestRate,
      updatedAt: new Date().toISOString(),
      source: 'live',
    });
  } catch (error) {
    console.error('Error fetching economic data', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Unknown error' },
      { status: 502 }
    );
  }
}
