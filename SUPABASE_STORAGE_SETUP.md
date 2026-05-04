# Supabase Storage Buckets Setup Guide

This document outlines all the Supabase Storage buckets required for the Parent Registration application and their configurations.

## Required Buckets

The application uses the following Supabase Storage buckets. All buckets should be created as **Private** (not public) with Row-Level Security (RLS) policies applied.

### 1. `proof_of_address`
**Purpose:** Store proof of address documents (utility bills, municipal accounts, bank statements)  
**File Types:** PDF, JPG, JPEG, PNG, DOC, DOCX  
**Max File Size:** 10 MB per file  
**Usage:** Financial verification and enrollment process

### 2. `id_documents`
**Purpose:** Store identity documents (ID copies, passports, birth certificates, learner documents)  
**File Types:** PDF, JPG, JPEG, PNG, DOC, DOCX  
**Max File Size:** 10 MB per file  
**Usage:** Identity verification for parents and students

### 3. `payslips`
**Purpose:** Store employment income verification (payslips)  
**File Types:** PDF, JPG, JPEG, PNG, DOC, DOCX  
**Max File Size:** 10 MB per file  
**Usage:** Financial assessment for fee affordability

### 4. `bank_statements`
**Purpose:** Store bank statements for financial verification  
**File Types:** PDF, JPG, JPEG, PNG, DOC, DOCX  
**Max File Size:** 10 MB per file  
**Usage:** Affordability assessment (typically 3 months of statements)

### 5. `academic_history`
**Purpose:** Store academic records and school reports  
**File Types:** PDF, JPG, JPEG, PNG, DOC, DOCX  
**Max File Size:** 10 MB per file  
**Usage:** Academic history verification and subject placement

### 6. `supporting_documents` (NEW)
**Purpose:** Store supporting documents for enrollment (birth certificates, school reports, immunization records)  
**File Types:** PDF, JPG, JPEG, PNG, DOC, DOCX  
**Max File Size:** 10 MB per file  
**Usage:** General supporting documentation for the registration process  
**Document Types Stored:**
- birth_certificate (Student's unabridged birth certificate)
- parent1_id (Parent/Guardian 1 ID or Passport)
- parent2_id (Parent/Guardian 2 ID or Passport)
- school_report (School report card)
- proof_of_address (Proof of residential address)
- immunization_record (Student immunization records)

## Bucket Configuration (RLS Policies)

Each bucket should have the following RLS policies applied:

### Enable RLS
```sql
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
```

### Example RLS Policy for Each Bucket

Replace `{bucket_name}` with the actual bucket name (e.g., `proof_of_address`, `id_documents`, etc.):

```sql
CREATE POLICY "Allow users to upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = '{bucket_name}' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to read their own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = '{bucket_name}'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = '{bucket_name}'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Setup Instructions

### Step 1: Create Buckets in Supabase Console

1. Navigate to your Supabase project
2. Go to **Storage** → **Buckets**
3. Create each bucket with these settings:
   - **Name:** (use the exact bucket names listed above)
   - **Public/Private:** Private
   - **File size limit:** 10 MB

### Step 2: Enable RLS on Buckets

For each bucket:

1. Click the bucket name
2. Go to **Policy** tab
3. Click **New Policy** and add the RLS policies above
4. Make sure policies are specific to authenticated users

### Step 3: Configure CORS (if needed for frontend access)

In Supabase console, under **Storage** settings:

```json
{
  "allowedHeaders": ["*"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "allowedOrigins": ["http://localhost:3000", "your-production-domain.com"],
  "exposedHeaders": [],
  "maxAgeSeconds": 3600,
  "supportsCredentials": true
}
```

## File Structure in Buckets

Files are stored using the following naming pattern:
```
{user_id}/{application_id}/{document_type}_{uuid}.{extension}
```

Example:
```
user123/app456/birth_certificate_a1b2c3d4.pdf
user123/app456/parent1_id_e5f6g7h8.jpg
```

## Backend Configuration

The backend uses the `bucket_mapping` in `document_service.py` to route files to the correct bucket:

```python
bucket_mapping = {
    "proof_of_address": "proof_of_address",
    "id_document": "id_documents",
    "payslip": "payslips",
    "bank_statement": "bank_statements",
    "academic_history": "academic_history",
    "transcript": "id_documents",
    # Supporting Documents fields
    "birth_certificate": "supporting_documents",
    "parent1_id": "supporting_documents",
    "parent2_id": "supporting_documents",
    "school_report": "supporting_documents",
    "immunization_record": "supporting_documents"
}
```

## Verification

To verify your buckets are properly configured:

1. Log in to the application
2. Navigate to the document upload section
3. Try uploading a test file
4. Check Supabase Storage console to confirm file appeared in correct bucket
5. Verify file is named with correct format: `{document_type}_{uuid}.{extension}`

## Troubleshooting

### Upload Fails with "Access Denied"
- Check RLS policies are enabled for the bucket
- Verify the file structure matches the policy requirements
- Ensure JWT token has proper `auth.uid()`

### Upload Fails with "Invalid Bucket"
- Check the bucket name matches exactly in `bucket_mapping`
- Verify bucket exists in Supabase console
- Check bucket name spelling (case-sensitive)

### File Size Limit Errors
- Ensure files are under 10 MB
- Check frontend and backend both enforce the same limit

### Files Not Appearing in Bucket
- Check user authentication is working
- Verify JWT token is valid
- Check RLS policies allow the INSERT operation
- Look at Supabase logs for detailed error messages

## Related Documentation

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Row Level Security (RLS) Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supporting Documents Feature](./TESTING_SUPPORTING_DOCUMENTS.md)
