import path from 'path';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { callHuggingFace } from '@/lib/huggingface';

export const runtime = 'nodejs';

const supabaseAdmin = createSupabaseAdmin();

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

function buildForecastPrompt(
  dailyData: Array<{ date: string; amount: number }>,
  scenario: 'expected' | 'best' | 'worst',
  whatIf: { salesPct: number; expensesPct: number }
) {
  const rows = dailyData
    .map(({ date, amount }) => `${date}: ${amount.toFixed(2)}`)
    .join('\n');

  const scenarioText =
    scenario === 'best'
      ? 'Optimistic scenario (assume slightly higher sales and smoother expenses).'
      : scenario === 'worst'
      ? 'Conservative scenario (assume lower sales and higher expenses).'
      : 'Base scenario (expected case).';

  const whatIfText = `Apply a what-if adjustment: increase sales by ${whatIf.salesPct}% and adjust expenses by ${whatIf.expensesPct}%.`;

  return `You are an expert financial forecaster specialized in Kenyan SMEs. Given the daily net cash flow data below (positive=income, negative=expense), produce a 90-day forecast of the same metric in JSON.

${scenarioText}
${whatIfText}

Provide:
1) an array "forecast" where each element is {"date": "YYYY-MM-DD", "point": NUMBER, "lower": NUMBER, "upper": NUMBER} representing the expected value and an 80% confidence band.
2) a short explanation (3-4 sentences) describing the most important drivers (e.g., seasonality due to school term, Madaraka Day, Christmas/December rush, election cycles, M-PESA fee changes).

Data:
${rows}

Return ONLY valid JSON (no markdown).`;
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not configured.' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
    }

    const userId = userData.user.id;

    // Fetch user's transaction history
    const { data: datasets, error: datasetsError } = await supabaseAdmin
      .from('datasets')
      .select('id')
      .eq('user_id', userId);

    if (datasetsError) {
      return NextResponse.json({ error: 'Failed to load datasets' }, { status: 500 });
    }

    type DatasetRow = { id: string };
    const datasetIds = (datasets ?? []).map((d: DatasetRow) => d.id);
    if (datasetIds.length === 0) {
      return NextResponse.json({ error: 'No datasets found' }, { status: 404 });
    }

    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('date, amount')
      .in('dataset_id', datasetIds)
      .order('date', { ascending: true });

    if (txError) {
      return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
    }

    const dailyMap = new Map<string, number>();

    type TransactionRow = { date: string; amount: number };

    (transactions ?? []).forEach((tx: TransactionRow) => {
      const dateKey = formatDate(tx.date);
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + tx.amount);
    });

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const body = await request.json();
    const scenario = (body?.scenario as 'expected' | 'best' | 'worst') ?? 'expected';
    const whatIf = {
      salesPct: typeof body?.whatIf?.salesPct === 'number' ? body.whatIf.salesPct : 0,
      expensesPct: typeof body?.whatIf?.expensesPct === 'number' ? body.whatIf.expensesPct : 0,
    };

    // Try running a local Python forecasting model first (if available)
    const python = process.env.PYTHON_PATH || 'python3';
    const { spawn } = await import('child_process');

    const scriptPath = path.join(process.cwd(), 'python', 'forecast_model.py');
    const proc = spawn(python, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    const input = JSON.stringify({
      transactions: dailyData.map((d) => ({ date: d.date, amount: d.amount })),
      horizon: 90,
      scenario,
      whatIf,
    });

    proc.stdin.write(input);
    proc.stdin.end();

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    proc.stdout.on('data', (chunk) => stdoutChunks.push(Buffer.from(chunk)));
    proc.stderr.on('data', (chunk) => stderrChunks.push(Buffer.from(chunk)));

    const exitCode: number = await new Promise((resolve) => {
      proc.on('close', resolve);
    });

    let parsed: any;
    if (exitCode === 0) {
      const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
      parsed = JSON.parse(stdout);
    } else {
      // Fallback to LLM if python call fails
      console.warn('Python forecast model failed:', Buffer.concat(stderrChunks).toString('utf-8'));
      const prompt = buildForecastPrompt(dailyData, scenario, whatIf);
      const hfResponse = await callHuggingFace(prompt);
      const generated = hfResponse.generated_text ?? '';
      parsed = JSON.parse(generated);
      parsed.model = process.env.HUGGINGFACE_MODEL || 'huggingface';
    }

    // Persist the forecast run (best effort; may fail if table is missing)
    try {
      await supabaseAdmin.from('forecast_runs').insert({
        user_id: userId,
        scenario,
        sales_pct: whatIf.salesPct,
        expenses_pct: whatIf.expensesPct,
        model: parsed.model || 'unknown',
        forecast: parsed.forecast,
        explanation: parsed.explanation,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not save forecast run:', e);
    }

    return NextResponse.json({
      forecast: parsed.forecast,
      explanation: parsed.explanation,
      model: parsed.model || 'unknown',
      feature_importances: parsed.feature_importances ?? [],
      scenario,
      whatIf,
    });
  } catch (error) {
    console.error('Forecast error', error);
    return NextResponse.json({ error: (error as Error).message ?? 'Unknown' }, { status: 500 });
  }
}
