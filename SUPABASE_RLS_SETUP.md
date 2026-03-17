# Supabase Setup Guide - RLS Policies

## ⚠️ Important: Enable RLS and Set Policies

Your app requires proper **Row-Level Security (RLS)** policies to work. Follow these steps:

---

## Step 1: Enable RLS on Tables

Go to your Supabase Dashboard → SQL Editor and run:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
```

---

## Step 2: Create RLS Policies

### For `profiles` table:

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);
```

### For `datasets` table:

```sql
-- Users can view their own datasets
CREATE POLICY "Users can view own datasets"
ON datasets FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own datasets
CREATE POLICY "Users can insert own datasets"
ON datasets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own datasets
CREATE POLICY "Users can update own datasets"
ON datasets FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own datasets
CREATE POLICY "Users can delete own datasets"
ON datasets FOR DELETE
USING (auth.uid() = user_id);
```

### For `transactions` table:

```sql
-- Users can view transactions from their datasets
CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT
USING (
  dataset_id IN (
    SELECT id FROM datasets
    WHERE datasets.user_id = auth.uid()
  )
);

-- Users can insert transactions to their datasets
CREATE POLICY "Users can insert own transactions"
ON transactions FOR INSERT
WITH CHECK (
  dataset_id IN (
    SELECT id FROM datasets
    WHERE datasets.user_id = auth.uid()
  )
);

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions"
ON transactions FOR UPDATE
USING (
  dataset_id IN (
    SELECT id FROM datasets
    WHERE datasets.user_id = auth.uid()
  )
);

-- Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
ON transactions FOR DELETE
USING (
  dataset_id IN (
    SELECT id FROM datasets
    WHERE datasets.user_id = auth.uid()
  )
);
```

---

## Step 3: Verify Policies Are Active

In Supabase Dashboard:
1. Go to **Authentication** → **Policies**
2. You should see all the policies listed
3. Each should show "Enabled" ✅

---

## Step 4: Test Upload

1. Go back to http://localhost:3000/dashboard/upload
2. Select your CSV file
3. Enter a dataset name
4. Click "Upload File"

It should now work! ✅

---

## Troubleshooting

**If it still fails:**

1. Check browser console (F12) for error details
2. Go to Supabase Dashboard → "Logs" to see exact error
3. Make sure policies are exactly as written above
4. Verify your user is authenticated (email confirmed in Supabase)

---

## Creating RLS Policies via Dashboard (Alternative)

If you prefer the UI instead of SQL:

1. Go to **Authentication** → **Policies**
2. Click "New Policy"
3. Choose "For specific operations" (SELECT, INSERT, UPDATE, DELETE)
4. Set conditions matching the SQL above
5. Save

---

**After completing these steps, your upload will work!** 🚀
