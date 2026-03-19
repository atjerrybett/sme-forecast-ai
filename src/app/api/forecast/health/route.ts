import path from 'path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const python = process.env.PYTHON_PATH || 'python3';
    const { spawn } = await import('child_process');

    const scriptPath = path.join(process.cwd(), 'python', 'forecast_model.py');
    const proc = spawn(python, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

    const dummyData = {
      transactions: Array.from({ length: 20 }, (_, i) => ({
        date: new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10),
        amount: 0,
      })),
      horizon: 1,
      scenario: 'expected',
      whatIf: { salesPct: 0, expensesPct: 0 },
    };

    proc.stdin.write(JSON.stringify(dummyData));
    proc.stdin.end();

    const stderrChunks: Buffer[] = [];
    proc.stderr.on('data', (chunk) => stderrChunks.push(Buffer.from(chunk)));

    const exitCode: number = await new Promise((resolve) => {
      proc.on('close', resolve);
    });

    if (exitCode !== 0) {
      return NextResponse.json(
        { ok: false, error: Buffer.concat(stderrChunks).toString('utf-8') },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, model: 'lightgbm-quantile' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}
