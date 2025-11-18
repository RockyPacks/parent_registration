# Production Deployment Guide

## Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account and project
- Docker (optional, for containerized deployment)

## Environment Setup

### 1. Supabase Configuration

1. Create a new Supabase project
2. Run the SQL schema from `backend/supabase_schema.sql` in your Supabase SQL editor
3. Create a storage bucket named `enrollment-documents`
4. Get your project credentials:
   - Project URL
   - Anon/Public key
   - Service Role key

### 2. Environment Variables

#### Frontend (.env)
```bash
VITE_API_BASE_URL=https://your-backend-domain.com
```

#### Backend (.env)
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FRONTEND_URL=https://your-frontend-domain.com
```

## Deployment Options

### Option 1: Manual Deployment

#### Frontend
```bash
npm install
npm run build
# Deploy dist/ folder to static hosting (Vercel, Netlify, AWS S3, etc.)
```

#### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
# Deploy to cloud platform (Heroku, Railway, AWS, etc.)
```

### Option 2: Docker Deployment

#### Using Docker Compose (Development/Testing)
```bash
docker-compose up --build
```

#### Individual Containers
```bash
# Frontend
docker build -t school-enrollment-frontend .
docker run -p 3000:80 school-enrollment-frontend

# Backend
cd backend
docker build -t school-enrollment-backend .
docker run -p 8000:8000 --env-file .env school-enrollment-backend
```

### Option 3: Cloud Platforms

#### Vercel (Frontend)
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variable: `VITE_API_BASE_URL`

#### Railway/Heroku (Backend)
1. Connect GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from .env

## Security Checklist

- [x] HTTPS enabled on all domains (Configure in production deployment)
- [x] Environment variables properly configured (Added validation in config.py)
- [x] CORS origins restricted to production domains (Updated main.py)
- [x] Supabase RLS policies configured (Created supabase_rls_policies.sql)
- [x] File upload size limits enforced (Confirmed 10MB limit + empty file check)
- [x] Input validation on all forms (All endpoints use Pydantic schemas)
- [x] Authentication required for sensitive operations (All sensitive endpoints use get_current_user)

## Monitoring

- Monitor application logs
- Set up error tracking (Sentry, etc.)
- Configure uptime monitoring
- Set up database backups

## Performance Optimization

- Enable gzip compression
- Configure CDN for static assets
- Optimize bundle size
- Set appropriate cache headers
- Monitor API response times

## Backup Strategy

- Database backups (Supabase handles this)
- File storage backups
- Application code versioning
- Environment configuration backups
