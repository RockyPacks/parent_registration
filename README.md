Enterprise Student Enrollment Platform

1. Project Overview

This Enterprise Student Enrollment Platform is a robust, multi-stage application for digital enrollment, built on a decoupled three-tier architecture to ensure high availability and data integrity.

Key Features

Guided Enrollment: Sidebar-driven workflow covering Student Info, Family, Medical, Academic, Documents, and Finance.

Real-time Auto-Save: Instant data persistence via the /auto-save endpoint to prevent data loss.

Secure Uploads: Integrated file management for sensitive documents to cloud storage.

Role-Based Security (RLS): Database-level access control, ensuring users only view/modify their own records.

Fee & Declaration: Dedicated steps for fee plan selection and digital agreement signing.

2. System Architecture

The system utilizes a decoupled Three-Tier Architecture for maintainability and clear separation of concerns.

Tier

Component

Technology

Primary Role

Client

Frontend

React, TS, Tailwind, Vite

UI, Form state, API interaction.

Application

Backend

FastAPI, Python 3.14

Business logic, routing, Pydantic validation, token verification.

Data

Database

Supabase (PostgreSQL, Auth, Storage)

Secure data persistence, RLS, document storage.

3. Technology Stack

The platform is built on Python and JavaScript stacks, managed by FastAPI and React/TypeScript, respectively.

3.1. Backend (backend/)

Category

Technology

Purpose

Framework/Lang

FastAPI, Python 3.14

High-performance API and core logic.

Data/Schema

Pydantic, Supabase SDK

Validation, configuration, and DB interaction.

Server/Testing

Uvicorn/Gunicorn, Pytest

ASGI server and comprehensive test suite.

3.2. Frontend (frontend/)

Category

Technology

Purpose

Framework/Lang

React, TypeScript

Component-based UI and type safety.

Styling/Build

Tailwind CSS, Vite

Responsive design and rapid bundling.

State/API

React Hooks, Fetch API

State management and backend communication.

4. Local Development Setup

Running the application requires both Backend and Frontend setup.

Prerequisites

Python 3.14 (or compatible) and Node.js (v18+).

Supabase Project Keys: URL, Anon Key, and Service Role/JWT Secret.

4.1. Backend Setup

Initialize a virtual environment and install dependencies:

cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt


Configure .env using keys from prerequisites, ensuring BACKEND_CORS_ORIGINS is set to http://localhost:5173.

Start the FastAPI server (API docs at http://localhost:8000/docs):

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


4.2. Frontend Setup

Install dependencies:

cd ../frontend
npm install


Configure .env with VITE_APP_API_URL (http://localhost:8000/api/v1) and your Supabase credentials.

Start the React server (accessible at http://localhost:5173):

npm run dev


5. Database & Security Setup

The platform relies on Supabase (PostgreSQL) for its data layer.

5.1. Migrations and RLS

Schema changes are managed via SQL files in backend/db/migrations/. These files must be executed on the Supabase instance to establish the schema and Row-Level Security (RLS). The critical supabase_rls_policies.sql ensures that all data access (CRUD) is strictly limited to the authenticated user's ID (auth.uid()), which is non-negotiable for production.

5.2. Supabase Storage

Secure Supabase Storage Buckets must be configured for the DocumentUploadCenter. Bucket policies must ensure that only authenticated users with a valid JWT can upload and retrieve their files.

6. Testing and Documentation

6.1. Backend Testing

A comprehensive Pytest suite is included for service reliability:

Unit Tests: (backend/app/tests/unit/) for isolated business logic testing.

Integration Tests: (backend/app/tests/integration/) for API and service layer interactions.

Run tests: cd backend && pytest.

6.2. API Documentation

FastAPI provides automatic, interactive documentation:

Swagger UI: http://localhost:8000/docs

ReDoc: http://localhost:8000/redoc
