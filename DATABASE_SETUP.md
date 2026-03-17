# Database Setup Guide

## ⚠️ Current Error
```
Failed to create dataset: Could not find the table 'public.datasets' in the schema cache
```

This means your Supabase database is missing the required tables. **You need to create them first.**

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Go to Supabase SQL Editor
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Create the Tables
Copy and paste **all** of this SQL into the SQL Editor:

```sql
-- Create profiles table (linked to auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create datasets table
CREATE TABLE datasets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  row_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_transactions_dataset_id ON transactions(dataset_id);
CREATE INDEX idx_transactions_date ON transactions(date);
```

### Step 3: Run the SQL
1. Click **Run** (bottom right) or press **Ctrl+Enter**
2. Wait for it to complete ✅
3. You should see green checkmarks

### Step 4: Enable Row-Level Security (RLS)
Still in SQL Editor, copy and paste this:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- PROFILES table policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- DATASETS table policies
CREATE POLICY "Users can view their own datasets"
  ON datasets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create datasets"
  ON datasets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
  ON datasets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets"
  ON datasets FOR DELETE
  USING (auth.uid() = user_id);

-- TRANSACTIONS table policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (
    dataset_id IN (
      SELECT id FROM datasets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions in their datasets"
  ON transactions FOR INSERT
  WITH CHECK (
    dataset_id IN (
      SELECT id FROM datasets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update transactions in their datasets"
  ON transactions FOR UPDATE
  USING (
    dataset_id IN (
      SELECT id FROM datasets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete transactions in their datasets"
  ON transactions FOR DELETE
  USING (
    dataset_id IN (
      SELECT id FROM datasets WHERE user_id = auth.uid()
    )
  );
```

Click **Run** again ✅

### Step 5: Verify Setup
Go to **Authentication → Policies** in left sidebar and verify you see all the policies listed.

### Step 6: Test Upload
1. **Refresh your browser** - http://localhost:3000/dashboard/upload
2. Select your CSV file
3. Click **Upload File**
4. ✅ It should work now!

---

## ✅ What These Tables Do

| Table | Purpose |
|-------|---------|
| `profiles` | Stores user information (name, creation date) |
| `datasets` | Stores each uploaded CSV file metadata |
| `transactions` | Stores individual financial transactions from CSVs |

---

## 🔒 What RLS Does

Row-Level Security ensures:
- Users only see their own datasets and transactions
- Users can't access other users' data
- Data is protected at the database level

---

## ❌ If You Get Errors

### Error: "relation already exists"
→ Tables already created. Skip to Step 4 (RLS policies)

### Error: "syntax error"
→ Check you copied the SQL exactly. Make sure there are no missing semicolons.

### Error: "permission denied"
→ Make sure you're running in SQL Editor (not Data Editor)

---

## 📝 CSV Format Reminder

Once tables are created, your CSV must have:

```csv
date,amount,description,category
2024-01-15,1500,Rent Payment,Expenses
2024-01-20,-500,Utilities,Expenses
2024-02-01,5000,Client Payment,Income
```

**Required columns:**
- `date` (format: YYYY-MM-DD)
- `amount` (number: positive or negative)

**Optional columns:**
- `description` (text)
- `category` (text)

---

## 🎯 After Setup

1. ✅ Refresh browser
2. ✅ Upload CSV file
3. ✅ Go to Transactions page to see imported data
4. ✅ Go to Forecast page to see charts and predictions

---

**That's it! Your database is ready.** 🚀
