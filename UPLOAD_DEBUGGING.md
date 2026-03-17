# Upload Debugging Guide

## ✅ What Was Fixed

1. **Input Text Visibility** ✅
   - All input fields now show clear, dark text
   - Password fields are now readable
   - Dataset name field is clear

2. **Better Error Logging** ✅
   - More detailed error messages
   - Console logs to help diagnose issues

---

## 🔍 If Upload Still Fails

Follow these debugging steps:

### Step 1: Open Browser Console
1. Press **F12** on your keyboard
2. Click the **Console** tab
3. Try uploading your CSV again
4. **Copy the error message** you see

### Step 2: Check Error Details
The console should show one of these:

**Error Type A:** `Failed to create dataset: permission denied`
→ **Solution:** Need to set up RLS policies (see SUPABASE_RLS_SETUP.md)

**Error Type B:** `Failed to insert transactions: permission denied`
→ **Solution:** Need to set up RLS policies (see SUPABASE_RLS_SETUP.md)

**Error Type C:** `CSV must contain "date" and "amount" columns`
→ **Solution:** Check your CSV headers (must be lowercase: date, amount)

**Error Type D:** `No valid transactions found in CSV`
→ **Solution:** Check CSV values - date format must be YYYY-MM-DD, amount must be a number

### Step 3: Check Supabase Logs
1. Go to **Supabase Dashboard**
2. Click **Logs** (top right)
3. Look for error messages
4. Share what you see

---

## ✅ RLS Policies Checklist

Make sure these are done:

- [ ] Went to Supabase Dashboard
- [ ] Clicked SQL Editor
- [ ] Ran the `ALTER TABLE...ENABLE ROW LEVEL SECURITY` statements
- [ ] Ran ALL the policy creation statements
- [ ] Checked Authentication → Policies to verify they're enabled
- [ ] Refreshed the browser

**If all checkboxes are done, try uploading again.**

---

## 📋 CSV Format Checklist

Your CSV must have:

- [ ] Column names in LOWERCASE: `date`, `amount`, `description`, `category`
- [ ] At least 2 rows (header + 1 data row)
- [ ] Date format as `YYYY-MM-DD`
- [ ] Amount as numbers (e.g., `1500` or `-200`)
- [ ] No special characters in headers

### Example CSV (Copy & Paste):
```csv
date,description,amount,category
2024-01-15,Office Rent,-1500,Expenses
2024-01-20,Product Sales,5000,Income
2024-01-25,Utilities,-200,Expenses
```

---

## 🆘 Still Having Issues?

**Try these in order:**

1. **Refresh the page** - http://localhost:3000/dashboard/upload
2. **Clear browser cache** - Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
3. **Close and reopen browser**
4. **Check the console error** (press F12)
5. **Verify RLS policies are created** (Supabase → Authentication → Policies)
6. **Make sure your email is confirmed** in Supabase

---

## 💡 Quick Test

Try uploading this exact CSV to test:

1. Create a file called `test.csv`
2. Copy this exact content:
```csv
date,description,amount,category
2024-01-01,Test Income,1000,Income
2024-01-02,Test Expense,-500,Expenses
```
3. Upload with dataset name: `Test Dataset`
4. If it works, your issue was the CSV format
5. If it fails, your issue is RLS policies

---

## ⚡ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Text is faint/hard to read | ✅ Fixed! Refresh your page |
| Upload button disabled | Fill in Dataset Name field |
| "permission denied" error | Set up RLS policies |
| "CSV must contain" error | Check CSV headers are lowercase |
| No error but nothing uploads | Check Supabase Logs |
| File not selected | Click upload area and choose file |

---

## 📞 How to Get Help

When asking for help, provide:

1. **The exact error message** from the console (F12)
2. **Your CSV file content** (first 3 lines)
3. **Screenshot of the error**
4. **Whether RLS policies are set up**

---

**Refresh your browser now and try uploading!** The text visibility is now fixed. 🚀
