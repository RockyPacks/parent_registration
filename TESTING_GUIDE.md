# Testing Guide for Deployment Fixes

This guide provides step-by-step instructions to verify the deployment fixes applied to the backend, frontend, and database integration.

---

## Backend Testing

1. **Environment Variables**
   - Confirm all required environment variables are set correctly:
     - SUPABASE_URL
     - SUPABASE_ANON_KEY
     - SUPABASE_SERVICE_ROLE_KEY
     - SUPABASE_JWT_SECRET
     - FRONTEND_URL (e.g., https://parent-registration-frontend.onrender.com)

2. **Install Requirements**
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Start Backend**
   ```bash
   uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
   ```

4. **Test API Health**
   - Send a GET request to `/health` endpoint:
     ```bash
     curl http://localhost:8000/health
     ```
   - Confirm response is:
     ```json
     {"status":"healthy"}
     ```

5. **Check CORS**
   - Confirm backend accepts requests from `FRONTEND_URL` domain.
   - Attempt AJAX request from frontend domain to backend API.

6. **Validate Error Messages**
   - Temporarily unset any required env var and restart backend.
   - Confirm error messages clearly list missing environment variables.

---

## Frontend Testing

1. **Set Environment Variables**
   - In `.env` or environment, set:
     ```
     VITE_API_BASE_URL=https://your-backend.com/api/v1
     VITE_SUPABASE_URL=your_supabase_project_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **Serve Frontend**
   - Serve the `dist/` directory using any static server for testing (e.g., `serve`, `http-server`).

4. **Verify API Connectivity**
   - Access frontend in browser.
   - Test critical user flows that talk to backend (e.g., form submissions).
   - Confirm no network errors.

---

## Database Testing

1. **Run Migrations**
   - Follow instructions in `backend/MIGRATIONS.md` to run all SQL migration files in Supabase.

2. **Verify Schema**
   - Confirm new tables and columns exist.

3. **Test Data Flow**
   - Use API to submit sample data.
   - Confirm data is saved correctly in Supabase.

---

## Integration Testing

1. **Deploy to Staging**
   - Deploy backend and frontend using the above environment variables.
   
2. **Run End-to-End Tests**
   - Test all main user journeys, forms, and API interactions.
   - Verify no error or missing data issues.

---

## Notes

- These tests address the critical deployment fixes applied.
- If any issues are found during testing, report back so fixes can be applied.

---

This guide can be followed progressively, and the depth of testing can be adjusted as needed.
