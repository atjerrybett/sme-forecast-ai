# ForecastFlow 📊

**AI-powered financial forecasting for SMEs**

A full-stack app that lets teams upload transaction CSVs, visualize cashflow, and run short-term forecasts (LightGBM + optional LLM).

---

## Quick Start

1) Clone + install
```bash
git clone https://github.com/atjerrybett/sme-forecast-ai.git
cd sme-forecast-ai
npm install
```

2) Configure
Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3) Run
```bash
npm run dev
```

Open: http://localhost:3000

---

## Highlights

- ✅ Supabase auth + secure multi-user data (RLS)
- ✅ CSV upload + transactions dashboard
- ✅ Forecasts (Python LightGBM model + LLM fallback)
- ✅ Economic indicators (USD/KES, inflation, GDP, real rate)
- ✅ Charts + KPI dashboards (Recharts + Tailwind)

---

## ML Model (Python)

The forecast endpoint uses `python/forecast_model.py` (LightGBM quantile regression).

Run it manually:
```bash
python -m pip install -r python/requirements.txt
python python/forecast_model.py < input.json
```

---

## More Docs

For detailed setup, database schema, and Supabase RLS rules, see:
- `QUICK_START.md`
- `DATABASE_SETUP.md`
- `SUPABASE_RLS_SETUP.md`
- `UPLOAD_DEBUGGING.md`

---

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

---

## License

MIT
