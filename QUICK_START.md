# 🚀 Quick Start Guide

## Start Development
```bash
cd /Users/adfmin/Desktop/sme-forecast-ai
npm run dev
```
→ Open http://localhost:3000

## Build & Run Production
```bash
npm run build
npm start
```

## Code Quality
```bash
npm run lint    # Check code quality
```

---

## 🎯 Feature Walkthrough

### 1. Sign Up (New User)
- Click "Sign Up"
- Enter email & password
- Enter full name
- Confirm email (check inbox)

### 2. Sign In (Returning User)
- Click "Sign In"
- Enter email & password
- Get redirected to dashboard

### 3. Upload CSV
1. Click "Upload Data"
2. Drag-drop your CSV file OR click to browse
3. Name your dataset
4. Click "Upload File"

**CSV Requirements:**
- Must have `date` and `amount` columns
- Optional: `description`, `category`
- Format: date as YYYY-MM-DD

Example CSV:
```csv
date,description,amount,category
2024-01-01,Office Rent,-5000,Expenses
2024-01-05,Product Sales,15000,Income
2024-01-10,Utilities,-500,Expenses
```

### 4. View Transactions
- Click "Transactions" in sidebar
- Filter by category dropdown
- Sort by Date or Amount
- See summary stats (Total, Income, Expenses)

### 5. View Forecast
- Click "Forecast" in sidebar
- Read AI-generated insights
- See line chart (actual vs forecast)
- View bar chart (income vs expense by category)
- Get growth predictions

### 6. Sign Out
- Click avatar in sidebar
- Click "Sign Out"
- Redirected to home

---

## 📁 Key Files to Know

### Pages
- `src/app/page.tsx` - Home page with signup/signin links
- `src/app/auth/signup/page.tsx` - Sign up form
- `src/app/auth/signin/page.tsx` - Sign in form
- `src/app/dashboard/page.tsx` - Dashboard home
- `src/app/dashboard/upload/page.tsx` - CSV upload
- `src/app/dashboard/transactions/page.tsx` - Data table
- `src/app/dashboard/forecast/page.tsx` - Charts & forecast

### Components & Utils
- `src/lib/supabase.ts` - Supabase client setup
- `src/lib/auth.ts` - Auth helper functions
- `src/lib/useProtectedRoute.ts` - Route protection hook
- `src/lib/utils.ts` - Utility functions
- `src/types/index.ts` - TypeScript types

---

## 🔗 Working Links

- Home: http://localhost:3000
- Sign Up: http://localhost:3000/auth/signup
- Sign In: http://localhost:3000/auth/signin
- Dashboard: http://localhost:3000/dashboard
- Upload: http://localhost:3000/dashboard/upload
- Transactions: http://localhost:3000/dashboard/transactions
- Forecast: http://localhost:3000/dashboard/forecast

---

## 📊 Database Tables

### profiles
- `id` (primary key)
- `full_name`
- `created_at`

### datasets
- `id` (primary key)
- `user_id` (foreign key to profiles)
- `name`
- `uploaded_at`
- `row_count`

### transactions
- `id` (primary key)
- `dataset_id` (foreign key to datasets)
- `date`
- `description`
- `amount`
- `category`

---

## 💡 Tips & Tricks

### Import Pattern
All imports use `@/*` alias:
```typescript
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/types';
```

### Formatting
Utils include currency & date formatters:
```typescript
import { formatCurrency, formatDate } from '@/lib/utils';

formatCurrency(1500)  // → "$1,500.00"
formatDate('2024-01-15')  // → "Jan 15, 2024"
```

### Protected Routes
All dashboard pages auto-check auth:
```typescript
const { isLoading, user } = useProtectedRoute();
// Redirects to /auth/signin if not authenticated
```

---

## 🔒 Security Notes

- Authentication is via Supabase
- All dashboard routes are protected
- Users can only see their own data
- Passwords are hashed securely
- Environment variables kept secret

---

## 📱 Responsive Design

- Desktop: Full sidebar navigation
- Tablet: Responsive table layout
- Mobile: Collapsible sidebar, stacked cards

---

## 🎨 Tailwind CSS

All styling uses Tailwind utilities:
- Colors: Blue (#3b82f6), Green (#10b981), Red (#ef4444)
- Spacing: Consistent padding/margins
- Responsive: `md:`, `lg:` breakpoints

---

## ✅ Checklist

- [x] Authentication working
- [x] CSV upload working
- [x] Data visualization working
- [x] Forecasting working
- [x] All pages styled
- [x] ESLint passing
- [x] TypeScript strict mode
- [x] Production build passing
- [x] Ready for deployment

---

## 🚀 Deploy to Vercel

1. Push to GitHub
2. Go to vercel.com
3. Click "New Project"
4. Import your repository
5. Add environment variables
6. Click "Deploy"

**Environment variables needed:**
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

## 🎓 Learning Resources

Embedded in code:
- TypeScript interfaces for all data types
- Proper error handling with try-catch
- Commented functions for clarity
- Best practices throughout

---

**You're all set! Start with `npm run dev` and enjoy your app! 🎉**
