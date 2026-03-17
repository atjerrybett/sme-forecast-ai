# COPY THIS SQL - No Changes Needed!

Just copy everything below and paste it into Supabase. Don't change anything!

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

---

# Step-by-Step Instructions for Beginners

## What You're About to Do
You're creating 3 filing cabinets (called "tables") in your database to store:
1. **profiles** = Your account info
2. **datasets** = Info about each CSV file you upload
3. **transactions** = The actual money data from your CSVs

Think of it like creating empty spreadsheets that your app will fill with data.

---

## STEP 1: Open Supabase
1. Go to https://app.supabase.com
2. Sign in with your email
3. Click on your project name (you should see it listed)

---

## STEP 2: Find SQL Editor
On the left side, you'll see a menu with options. Look for:
- 🏠 Home
- 📊 **SQL Editor** ← Click this one
- 🔐 Authentication
- 📋 Database

**Click "SQL Editor"**

---

## STEP 3: Create New Query
At the top, you'll see a button that says:
- **+ New Query**

**Click it.** A text box will appear.

---

## STEP 4: Paste the SQL
1. Copy the big SQL block above (the one with all the CREATE TABLE stuff)
2. Click in the text box in Supabase
3. Paste it (Cmd+V on Mac, Ctrl+V on Windows)

You should see the SQL appear in the box.

---

## STEP 5: Run It
At the bottom right of that text box, you'll see a button:
- **Run** (blue button)

Or you can press: **Ctrl+Enter** (Windows) or **Cmd+Enter** (Mac)

**Click Run.**

---

## STEP 6: Wait for Green Checkmarks
You should see:
- ✅ CREATE TABLE profiles... 
- ✅ CREATE TABLE datasets...
- ✅ CREATE TABLE transactions...
- ✅ CREATE INDEX...

**Green checkmarks = Success!** Your tables are created.

---

## STEP 7: Create Policies (Security Rules)
Now you need to create security rules so people can only see their own data.

1. Click **+ New Query** again
2. Go back to [DATABASE_SETUP.md](DATABASE_SETUP.md)
3. Copy the SQL from **Step 4** (the ALTER TABLE and CREATE POLICY stuff)
4. Paste it in the new query box
5. Click **Run**

**Wait for green checkmarks again.** ✅

---

## STEP 8: Back to Your App
1. Go to http://localhost:3000/dashboard/upload
2. **Refresh the page** (Cmd+R or Ctrl+R)
3. Try uploading your CSV file again
4. 🎉 It should work now!

---

## If Something Goes Wrong

### You see: "relation already exists"
→ Good! The tables are already there. Skip to STEP 7.

### You see: "permission denied"
→ Make sure you're in SQL Editor (not Data Editor). Try again.

### Nothing happens / No checkmarks
→ Check your internet. Try clicking Run again.

### Still can't upload after this
→ Go to your browser console (press F12) and look for error messages. Let me know what it says.

---

**That's it! Just paste and click Run. Super simple.** 🚀
