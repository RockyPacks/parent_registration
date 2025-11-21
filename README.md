# 🚀 Enterprise Student Enrollment Platform

## 📖 1. Project Overview

This Enterprise Student Enrollment Platform is a robust, multi-stage application designed to digitize and streamline the student enrollment process. It is engineered with a decoupled three-tier architecture to ensure high availability, data integrity, and a clear path for future scaling and feature development. The platform handles everything from initial parent authentication to final document submission and fee agreement selection.

### ✨ Key Features and Functional Breakdown

The application is structured around critical functional areas, prioritizing user experience and data safety:

- **📝 Guided Enrollment (Form Completion Stepper)**: The entire application process is presented as a clear, sidebar-driven workflow, guiding users through six major stages: Student Info, Family, Medical, Academic History, Documents, and Finance. This ensures no mandatory data is missed and provides continuous progress visibility.

- **💾 Real-time Auto-Save (Resilience)**: To prevent data loss during long application sessions, all form data is continuously sent to the backend via the efficient `/enrollment/auto-save` endpoint. This uses a high-performance patch/upsert mechanism, ensuring only changed fields are updated and allowing parents to seamlessly resume their application at any time.

- **🔒 Secure Document Uploads (Integrity)**: The platform includes an integrated Document Upload Center for sensitive materials like birth certificates and financial statements. File management is secured by proxying all uploads through the FastAPI backend to Supabase Storage, enforcing authentication and validating file types before storage.

- **🛡️ Role-Based Security (RLS) and Data Isolation**: Row-Level Security (RLS) is rigorously applied at the PostgreSQL layer. This is the foundation of data privacy, ensuring that an authenticated user can only read, update, or delete records specifically tied to their user_id, guaranteeing strict data isolation between different parent accounts.

- **💰 Fee Plan Selection and Digital Declaration**: Dedicated steps are included for selecting preferred financing or fee plans (handled by the Financing Router) and concluding the process with a legally binding digital Declaration and Agreement signing, simplifying compliance and administrative finalization.

## 🏗️ 2. System Architecture

The Enrollment Platform operates on a decoupled Three-Tier Architecture, which dictates a specific data and control flow between the layers. This structure minimizes dependencies and facilitates independent development and deployment of each tier.

### 🔄 Layer Responsibilities and Communication

| Tier       | Component    | Technology                  | Primary Responsibilities                          | Communication Protocol |
|------------|--------------|-----------------------------|---------------------------------------------------|-------------------------|
| 🖥️ Client     | Frontend     | React, TypeScript, Tailwind, Vite | UI rendering, user authentication, form state management, user session handling. | HTTPS/REST (API Calls) |
| ⚙️ Application| Backend      | FastAPI, Python 3.14        | Business logic execution, request validation (Pydantic), security token verification, and orchestrating database transactions. | HTTPS/REST, JWT Validation |
| 🗄️ Data       | Database     | Supabase (PostgreSQL, Auth, Storage) | Persistent storage of enrollment data, file binary storage, user authentication, and RLS enforcement. | PostgreSQL/SQL, Supabase Client |

### 📊 Data Flow and Contracts

All communication adheres to strict contracts:

- **Frontend to Backend**: Requests carry a JWT Bearer Token (obtained from Supabase Auth) in the Authorization header. Data payloads are validated by Pydantic Schemas on the backend.

- **Backend to Data**: The FastAPI layer utilizes the Supabase Python client to interact with PostgreSQL and Storage, often relying on the user's validated user_id to scope database queries.

## 🛠️ 3. Technology Stack

The platform is built on modern, high-performance technology stacks for stability and speed.

### 🐍 3.1. Backend (`backend/`)

The core API is built on the Python ecosystem, maximizing performance for data validation and I/O tasks.

| Category      | Technology                  | Purpose                                      | Implementation Details |
|---------------|-----------------------------|----------------------------------------------|-------------------------|
| Framework/Lang| FastAPI, Python 3.14        | High-performance API and core logic.         | Asynchronous handlers ensure fast response times for concurrent users. Structured into Routers, Services, and Repositories. |
| Data/Schema   | Pydantic, Supabase SDK      | Request and response schema validation, configuration, and Database interaction. | Pydantic models ensure strong data typing and integrity at the API boundary, preventing malformed data entry. |
| Server/Testing| Uvicorn/Gunicorn, Pytest    | ASGI server and comprehensive test suite.    | Gunicorn handles process management in production, serving Uvicorn workers. Includes libraries like httpx for efficient test client requests. |
| Security/Config| python-jose, pydantic-settings | JWT token processing and environment variable management. | Ensures secure parsing and validation of JWTs issued by Supabase Auth and manages configurations across environments. |

### ⚛️ 3.2. Frontend (`frontend/`)

The client is optimized for speed and a mobile-first responsive design.

| Category      | Technology                  | Purpose                                      | Implementation Details |
|---------------|-----------------------------|----------------------------------------------|-------------------------|
| Framework/Lang| React, TypeScript           | Component-based UI and type safety.          | Functional components and hooks are used for clean state management. TypeScript eliminates many common runtime errors, improving reliability. |
| Styling/Build | Tailwind CSS, Vite          | Utility-first responsive design and rapid bundling. | Tailwind classes enable rapid, highly responsive styling without external CSS files. Vite provides an extremely fast development server and optimized production build. |
| State/API     | React Hooks, Fetch API, react-hook-form | State management, form validation, and backend communication. | The application utilizes a custom state management strategy built around React Context and standard hooks. react-hook-form manages complex, multi-step form state and validation logic. |
| UI Components | Shadcn/UI components        | Modern, accessible, and themeable UI components. | Components like buttons, inputs, and date pickers are built on headless UI libraries for maximum control over styling and behavior. |

## 🔧 4. Local Development Setup

A successful local environment setup is crucial for development and quality assurance.

### 📋 Prerequisites

- Python 3.14 (or compatible, managed via tools like pyenv).
- Node.js (v18+ or latest LTS recommended, managed via nvm).
- Supabase Project Keys: You require the Project URL, Anon Key, and the Service Role/JWT Secret (for backend environment variables) from your Supabase instance.
- Local Networking: Ensure ports 8000 (Backend) and 5173 (Frontend) are open and available.

### 🔧 4.1. Backend Setup

The backend must be running before the frontend can connect.

Initialize a virtual environment and install all Python dependencies defined in `requirements.txt`:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Configure the local environment. Create a `.env` file in the `backend/` directory, populating it with required secrets and configuration variables. Crucially, the `BACKEND_CORS_ORIGINS` must include the frontend's local address: `http://localhost:5173`.

Start the FastAPI server. The `--reload` flag enables automatic code reloading on file changes for rapid development iterations (API documentation is always available at the `/docs` path):

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 🎨 4.2. Frontend Setup

The frontend serves the user interface and connects to the running backend API.

Install all required Node/React dependencies, as defined in `package.json`:

```bash
cd ../frontend
npm install
```

Configure the local environment. Create a `.env.local` file in the `frontend/` directory. This must include the API URL: `VITE_APP_API_URL=http://localhost:8000/api/v1`, and the Supabase public keys for client-side Auth operations.

Start the React development server. This step compiles the TypeScript and serves the SPA, which will automatically proxy API calls to the FastAPI instance:

```bash
npm run dev
```

## 🗄️ 5. Database & Security Setup

The platform relies on Supabase (PostgreSQL) for its data layer.

### 📄 5.1. Migrations and RLS

Schema changes are managed via SQL files in `backend/db/migrations/`. These files must be executed on the Supabase instance to establish the schema and Row-Level Security (RLS). The critical `supabase_rls_policies.sql` ensures that all data access (CRUD) is strictly limited to the authenticated user's ID (`auth.uid()`), which is non-negotiable for production.

### ☁️ 5.2. Supabase Storage

Secure Supabase Storage Buckets must be configured for the DocumentUploadCenter. Bucket policies must ensure that only authenticated users with a valid JWT can upload and retrieve their files.

## 🧪 6. Testing and Documentation

### ✅ 6.1. Backend Testing

A comprehensive Pytest suite is included for service reliability:

- **Unit Tests**: (`backend/app/tests/unit/`) for isolated business logic testing.
- **Integration Tests**: (`backend/app/tests/integration/`) for API and service layer interactions.

Run tests:

```bash
cd backend && pytest
```
Location,Variable,Purpose,Source
backend/.env,SUPABASE_URL,Supabase Project URL,
backend/.env,SUPABASE_ANON_KEY,Supabase Public Key,
backend/.env,SUPABASE_SERVICE_ROLE_KEY,Supabase Service Role Key (Used for server-side operations),
backend/.env,SUPABASE_JWT_SECRET,Supabase JWT Secret (Used for verifying Auth tokens),
frontend/.env.local,VITE_SUPABASE_URL,Supabase Project URL (Client-side use),
frontend/.env.local,VITE_SUPABASE_ANON_KEY,Supabase Anon Key (Client-side use for Auth operations),
### 📚 6.2. API Documentation

FastAPI provides automatic, interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
