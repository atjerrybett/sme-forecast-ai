import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

const supabaseAdmin = createSupabaseAdmin();

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
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

    const { data: datasets, error: datasetsError } = await supabaseAdmin
      .from('datasets')
      .select('id')
      .eq('user_id', userId);

    if (datasetsError) {
      return NextResponse.json({ error: 'Failed to load datasets' }, { status: 500 });
    }

    const datasetIds = (datasets ?? []).map((d: { id: string }) => d.id);
    if (datasetIds.length === 0) {
      return NextResponse.json({ error: 'No datasets found' }, { status: 404 });
    }

    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('date, amount, category')
      .in('dataset_id', datasetIds)
      .order('date', { ascending: true });

    if (txError) {
      return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
    }

    type TxRow = { date: string; amount: number; category?: string };
    const transactionsPayload = (transactions ?? []).map((tx: TxRow) => ({
      date: formatDate(tx.date),
      amount: tx.amount,
      category: tx.category,
    }));

    // Run local python script (requires python & dependencies installed)
    const python = process.env.PYTHON_PATH || 'python3';
    const spawn = (await import('child_process')).spawn;

    const proc = spawn(python, ['python/shap_explain.py'], { stdio: ['pipe', 'pipe', 'pipe'] });

    const input = JSON.stringify({
      transactions: transactionsPayload,
      // allow the SHAP script to optionally provide feature explanations
      requestMeta: {
        userId,
      },
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

    if (exitCode !== 0) {
      const stderr = Buffer.concat(stderrChunks).toString('utf-8');
      console.error('SHAP script error:', stderr);
      return NextResponse.json({ error: 'SHAP explainability failed', details: stderr }, { status: 500 });
    }

    const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
    const parsed = JSON.parse(stdout);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('SHAP route error:', error);
    return NextResponse.json({ error: (error as Error).message ?? 'Unknown' }, { status: 500 });
  }
}
