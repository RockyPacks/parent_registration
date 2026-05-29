# Production Deployment Troubleshooting Guide

## Changes Made to Fix Production Failures

### 1. **Python Runtime Specification** (`runtime.txt`)
- Added `3.11.9` to ensure Render uses Python 3.11
- PyMuPDF has better pre-built wheel support on Python 3.11 vs 3.13
- Prevents version mismatches between development and production

### 2. **Render Deployment Config** (`render.yaml`)
- New deployment configuration file for Render
- Explicitly specifies build and start commands
- Ensures dependencies are installed before app starts
- Pre-configures environment variables with proper Render syntax

### 3. **Resilient PyMuPDF Import** (`backend/app/services/bank_statement_service.py`)
- Made PyMuPDF import optional with try/except
- Added runtime error handling in `_pdf_bytes_to_base64_images()`
- Prevents app startup failure if PyMuPDF can't load
- Provides clear error message if PDF processing is attempted without library

## Likely Production Issues & Solutions

### Issue 1: PyMuPDF Compilation Failures
**Symptoms:** Build fails during `pip install pymupdf`  
**Solution:** Using Python 3.11 provides pre-built wheels. If still fails, consider using alternative like `pypdf` (already in requirements.txt)

### Issue 2: Module Not Found Errors
**Symptoms:** `ModuleNotFoundError: No module named 'pymupdf'`  
**Solution:**
1. Check Render build logs
2. Ensure `requirements.txt` is being installed
3. Verify `buildCommand` in `render.yaml` runs before app starts

### Issue 3: Missing Environment Variables
**Symptoms:** `KeyError` or auth failures in logs  
**Solution:** 
1. Go to Render Dashboard → Backend Service Settings
2. Add missing env vars:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `FRONTEND_URL`

## Next Steps to Debug Production

1. **Check Render Build Logs:**
   - Go to Render Dashboard
   - Select the backend service
   - Click on "Logs" tab
   - Look for errors during pip install phase

2. **Check Runtime Logs:**
   - Look for import errors or crashes
   - Search for `pymupdf`, `fitz`, or `ModuleNotFoundError`

3. **Test the API:**
   - Visit: `https://parent-registration.onrender.com/docs` (Swagger UI)
   - Try a simple endpoint like `/api/v1/enrollment/` to see if server is running

4. **Common Fixes:**
   ```bash
   # If you need to manually test on Render:
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

## Recommendations

### Option A: Use Alternative PDF Library (Safer)
If PyMuPDF continues to fail on Linux, replace with `pypdf` which is already in requirements.txt:

```python
# Instead of fitz
import pypdf

def _pdf_bytes_to_base64_images(self, pdf_bytes: bytes):
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
    # ... process pages
```

### Option B: Add System Dependencies
Create `build.sh` with system package installation if PyMuPDF needs it:

```bash
#!/bin/bash
apt-get update
apt-get install -y libmupdf-dev mupdf-tools
pip install -r requirements.txt
```

### Option C: Use Alpine/Slim Base Image
If using Docker, use smaller base image that might have pre-compiled wheels.

---

**Last Updated:** May 29, 2026  
**Branch:** feat/upload-flow  
**Commit:** 8b1d231 (fix: production deployment config)
