# Step-by-Step Guide: Creating Supabase Storage Buckets

This guide walks you through creating each of the 6 storage buckets required for the Parent Registration application.

## Prerequisites

- Supabase project already created
- You have admin access to the Supabase project
- Logged into Supabase console

---

## Part 1: Access Supabase Storage

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in with your account
3. Select your project from the list
4. Click on **Storage** in the left sidebar
5. You should see a page with "Buckets" tab

---

## Bucket 1: `proof_of_address`

**Purpose:** Store proof of address documents (utility bills, bank statements, etc.)

### Steps:

1. Click the **"New bucket"** button (top right)
2. In the popup dialog:
   - **Bucket name:** `proof_of_address` (must be lowercase, no spaces)
   - **Public bucket:** ⭕ OFF (Select "Private" - this is important for security)
   - **File size limit:** 10 (in MB)
3. Click **"Create bucket"** button
4. You should see a confirmation: "Bucket created successfully"

### Expected Result:
- New bucket appears in the buckets list
- Icon shows as 🔒 (locked/private)

---

## Bucket 2: `id_documents`

**Purpose:** Store identity documents (IDs, passports, birth certificates)

### Steps:

1. Click the **"New bucket"** button
2. In the popup dialog:
   - **Bucket name:** `id_documents` (lowercase, underscore between words)
   - **Public bucket:** ⭕ OFF (Select "Private")
   - **File size limit:** 10 (in MB)
3. Click **"Create bucket"** button
4. Wait for confirmation

### Expected Result:
- Second bucket now visible in list with 🔒 icon

---

## Bucket 3: `payslips`

**Purpose:** Store payslips for income verification

### Steps:

1. Click the **"New bucket"** button
2. In the popup dialog:
   - **Bucket name:** `payslips` (lowercase)
   - **Public bucket:** ⭕ OFF (Select "Private")
   - **File size limit:** 10 (in MB)
3. Click **"Create bucket"** button

### Expected Result:
- Third bucket created with 🔒 icon

---

## Bucket 4: `bank_statements`

**Purpose:** Store bank statements for financial verification

### Steps:

1. Click the **"New bucket"** button
2. In the popup dialog:
   - **Bucket name:** `bank_statements` (lowercase with underscore)
   - **Public bucket:** ⭕ OFF (Select "Private")
   - **File size limit:** 10 (in MB)
3. Click **"Create bucket"** button

### Expected Result:
- Fourth bucket created with 🔒 icon

---

## Bucket 5: `academic_history`

**Purpose:** Store academic records and school reports

### Steps:

1. Click the **"New bucket"** button
2. In the popup dialog:
   - **Bucket name:** `academic_history` (lowercase with underscore)
   - **Public bucket:** ⭕ OFF (Select "Private")
   - **File size limit:** 10 (in MB)
3. Click **"Create bucket"** button

### Expected Result:
- Fifth bucket created with 🔒 icon

---

## Bucket 6: `supporting_documents` ⭐ NEW

**Purpose:** Store supporting documents for enrollment (birth certs, school reports, immunization records)

### Steps:

1. Click the **"New bucket"** button
2. In the popup dialog:
   - **Bucket name:** `supporting_documents` (lowercase with underscore)
   - **Public bucket:** ⭕ OFF (Select "Private")
   - **File size limit:** 10 (in MB)
3. Click **"Create bucket"** button

### Expected Result:
- Sixth bucket created with 🔒 icon
- This is the new bucket for the Supporting Documents feature

---

## Verification: All 6 Buckets Created

After completing the steps above, your Supabase Storage page should show:

```
✓ Buckets
  🔒 academic_history
  🔒 bank_statements
  🔒 id_documents
  🔒 payslips
  🔒 proof_of_address
  🔒 supporting_documents
```

All buckets should have 🔒 icon (indicating they are Private/Secure).

---

## Part 2: Configure Row-Level Security (RLS) Policies

Now that all buckets are created, you need to add RLS policies to each one. This ensures users can only access their own files.

### For Each Bucket:

1. Click on the bucket name (e.g., `proof_of_address`)
2. Click the **"Policies"** tab at the top
3. Click **"New Policy"** button
4. You'll see options to create policies from templates

### Option A: Use Template (Faster)

1. Click **"New Policy"**
2. Select **"For authenticated users"** section
3. You'll see pre-made policies. Choose:
   - "Allow authenticated users to read their own objects" (SELECT)
   - Click "Review"
   - Click "Save Policy"
4. Repeat for INSERT and DELETE policies

### Option B: Create Custom Policy (More Control)

For each bucket, create 3 policies (SELECT, INSERT, DELETE):

#### Policy 1: Allow SELECT (Read)

1. Click **"New Policy"**
2. Choose **"SELECT"** from the dropdown
3. In the **"With (check)"** section, paste:
```sql
auth.uid()::text = (storage.foldername(name))[1]
```
4. Click "Review" → "Save Policy"

#### Policy 2: Allow INSERT (Upload)

1. Click **"New Policy"**
2. Choose **"INSERT"** from the dropdown
3. In the **"With (check)"** section, paste:
```sql
auth.uid()::text = (storage.foldername(name))[1]
```
4. Click "Review" → "Save Policy"

#### Policy 3: Allow DELETE (Remove)

1. Click **"New Policy"**
2. Choose **"DELETE"** from the dropdown
3. In the **"With (check)"** section, paste:
```sql
auth.uid()::text = (storage.foldername(name))[1]
```
4. Click "Review" → "Save Policy"

### Repeat for All 6 Buckets

You need to add these 3 policies to each bucket:
- ✓ proof_of_address
- ✓ id_documents
- ✓ payslips
- ✓ bank_statements
- ✓ academic_history
- ✓ supporting_documents

---

## Part 3: Verify Policies Are Working

### Check via Supabase Console

1. Click on each bucket
2. Go to **Policies** tab
3. You should see 3 policies listed:
   - One for SELECT
   - One for INSERT
   - One for DELETE

All should show the policy condition you set.

### Test via Application

1. Start your development server: `npm run dev`
2. Log in with a test account
3. Go to Step 1: Student Information
4. Scroll to "Supporting Documents" section
5. Try uploading a test file
6. Check in Supabase console:
   - Go to Storage → `supporting_documents` bucket
   - You should see the file in a folder structure like:
   ```
   user_123/
     └── app_456/
         └── birth_certificate_abc123.jpg
   ```

If the file appears, policies are working correctly! ✅

---

## Troubleshooting

### "Bucket already exists" Error
- The bucket might already be created
- Try refreshing the page or check the full list

### Upload fails with "403 Forbidden"
- RLS policies might not be configured correctly
- Check policies tab - should have 3 policies (SELECT, INSERT, DELETE)
- Make sure policies use the correct condition

### File size limit not enforced
- Limit is set to 10 MB per bucket
- Both frontend (5 MB) and backend (10 MB) enforce limits
- If needed, increase in bucket settings

### Cannot see uploaded files
- Check if bucket is Private (🔒 icon)
- Check user is authenticated
- Check file path matches RLS policy format: `{user_id}/{app_id}/{filename}`

---

## Summary Checklist

- [ ] All 6 buckets created (proof_of_address, id_documents, payslips, bank_statements, academic_history, supporting_documents)
- [ ] All buckets are Private (🔒 icon visible)
- [ ] All buckets have 10 MB file size limit
- [ ] RLS policies configured for each bucket (3 policies per bucket)
- [ ] Tested by uploading a file in the app
- [ ] File appears in correct bucket in Supabase console

---

## Next Steps

After completing this setup:

1. **Test the application:**
   - Run frontend: `cd frontend && npm run dev`
   - Run backend: `cd backend && uvicorn app.main:app --reload`
   - Test file uploads through the UI

2. **Verify data flow:**
   - Upload supporting documents
   - Check they appear in the supporting_documents bucket
   - Download PDF and verify documents are included

3. **Production deployment:**
   - Repeat these steps in your production Supabase project
   - Use same bucket names and RLS policies
   - Test in production environment

---

## Additional Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Policies Best Practices](https://supabase.com/docs/guides/storage/security)

---

**Last Updated:** 4 May 2026
