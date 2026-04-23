# Parent Registration System - Database Architecture

## 🏗️ Overview

The system uses a **dual Supabase database architecture** to separate concerns and optimize data access patterns:

1. **Primary Enrollment Database** - Handles all enrollment application data with strict RLS
2. **Schools Database** - Read-only reference data for school selection

---

## 📊 Database 1: Primary Enrollment Database

**URL:** `https://guucarfnghsgisvdoxnt.supabase.co`

**Purpose:** Core application data with strict Row-Level Security (RLS) enforcement

### Key Characteristics:
- ✅ User-isolated data via RLS policies
- ✅ Contains sensitive parent and student information
- ✅ Supports real-time auto-save functionality
- ✅ Enforces authentication via Supabase JWT

### Core Tables:

#### **Applications** (Root Entity)
```sql
- id (UUID) - Primary Key
- user_id (UUID) - Foreign Key to auth.users
- status (enum: pending, in_progress, submitted, approved, rejected, completed)
- created_at, updated_at, submitted_at
```
- **Purpose:** Central enrollment application record
- **RLS:** Users can only access their own applications

#### **Students** (One per Application)
```sql
- id (UUID)
- application_id (UUID) - Foreign Key
- surname, first_name, middle_name, preferred_name
- date_of_birth, gender, home_language
- id_number (SA ID - validated)
- previous_grade, grade_applied_for
- previous_school
- email, phone
```
- **Validation:** SA ID must be 13 digits with Luhn checksum validation

#### **Medical Info** (One per Application)
```sql
- medical_aid_name, member_number
- conditions (text array)
- allergies
```

#### **Parents** (One per Application - Expanded)
```sql
- father_surname, father_first_name, father_id_number, father_mobile, father_email
- mother_surname, mother_first_name, mother_id_number, mother_mobile, mother_email
- next_of_kin_surname, next_of_kin_first_name, next_of_kin_relationship
- next_of_kin_mobile, next_of_kin_email
```

#### **Next of Kin** (Separate Table)
```sql
- id (UUID)
- application_id (UUID)
- surname, first_name, id_number
- relationship
- mobile_number, email_address
- physical_address
```
- **Purpose:** Dedicated table for emergency contact details

#### **Fee Responsibility** (One per Application)
```sql
- fee_person, relationship
- selected_plan
- fee_terms_accepted (boolean)
- parent_id_number, parent_first_name, parent_surname
- parent_email, parent_mobile
- bank_name, branch_code, account_number, account_type
```
- **Purpose:** Tracks which parent is responsible for fees and their payment details

#### **Academic History** (Multiple per Application)
```sql
- school_name, school_type
- last_grade_completed, academic_year_completed
- reason_for_leaving
- principal_name, school_phone_number, school_email, school_address
- report_card_url
```
- **Purpose:** Historical school records

#### **Declarations** (One per Application)
```sql
- Multiple boolean agreements:
  - agree_truth (truthfulness of information)
  - agree_policies (school policies)
  - agree_financial (financial obligations)
  - agree_verification (data verification)
  - agree_data_processing (data processing consent)
  - agree_audit_storage (audit and storage)
  - agree_affordability_processing (affordability assessment)
- full_name, city, date_signed
- status
```
- **Purpose:** Digital signatures and legal agreements

#### **Financing Selections** (One per Application)
```sql
- plan_type (financing plan selected)
- discount_rate, cost_of_credit
- repayment_term
```
- **Purpose:** Fee payment plan selection

#### **Application Documents** (Multiple per Application)
```sql
- document_type (birth_cert, id_copy, proof_of_residence, etc.)
- filename, original_filename, file_size, content_type
- storage_path
- download_url
```
- **Purpose:** Manages uploaded documents in Supabase Storage

### Data Flow:
```
User Authentication (Supabase Auth)
    ↓
JWT Token Generated
    ↓
POST /enrollment/auto-save (Backend validates JWT)
    ↓
Backend patches/upserts data using service key
    ↓
RLS Policies verify user_id matches
    ↓
Data persisted in database
```

### RLS Policies:
All tables enforce policies like:
```sql
-- Users can only SELECT/INSERT/UPDATE their own data
SELECT: user_id = auth.uid()
INSERT: user_id = auth.uid()
UPDATE: user_id = auth.uid()
```

---

## 📚 Database 2: Schools Database

**URL:** `https://sndfrorebebtulfvzbyu.supabase.co`

**Purpose:** Reference data for school selection - read-only from frontend, updated via admin panel

### Key Characteristics:
- ✅ Shared reference data (no user isolation needed)
- ✅ Accessed during signup/enrollment
- ✅ Backend fetches via service key (bypasses RLS)
- ✅ Frontend receives via backend API endpoint

### Core Tables:

#### **Schools** (Read-Only Reference)
```sql
- id (integer)
- schoolName (varchar)
```
- **Purpose:** List of available schools for enrollment selection

### Data Flow:
```
Frontend User on Signup Page
    ↓
Calls GET /api/v1/schools
    ↓
Backend fetches from Schools Database using SERVICE KEY
    ↓
Schools Database queries Schools table
    ↓
Returns JSON array of schools
    ↓
Frontend populates dropdown
```

### Why Separate Database?
1. **Reference Data:** Schools don't change per user
2. **Scalability:** Can be updated independently
3. **Permissions:** Different access control requirements
4. **Performance:** Dedicated for read-heavy operations

---

## 🔌 Environment Configuration

### Backend (.env)
```
# Primary Database
SUPABASE_URL=https://guucarfnghsgisvdoxnt.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...

# Schools Database
SCHOOLS_SUPABASE_URL=https://sndfrorebebtulfvzbyu.supabase.co
SCHOOLS_SUPABASE_ANON_KEY=...
SCHOOLS_SUPABASE_SERVICE_KEY=...
```

### Frontend (.env)
```
# Primary Database (for auth)
VITE_SUPABASE_URL=https://guucarfnghsgisvdoxnt.supabase.co
VITE_SUPABASE_ANON_KEY=...

# Schools Database (optional, not used now - via backend API)
VITE_SCHOOLS_SUPABASE_URL=https://sndfrorebebtulfvzbyu.supabase.co
VITE_SCHOOLS_SUPABASE_ANON_KEY=...

# Backend API
VITE_API_BASE_URL=https://parent-registration.onrender.com/api/v1
```

---

## 🔐 Security Architecture

### Row-Level Security (RLS)
- All tables in enrollment database have RLS **ENABLED**
- Policies enforce `user_id = auth.uid()` on SELECT/INSERT/UPDATE
- Prevents cross-user data access at database level

### Key Types:
- **Anon Key:** For frontend authentication flows (limited access)
- **Service Role Key:** For backend (full access, bypasses RLS)
- **JWT Secret:** For token validation

### API Endpoint Security:
```
GET /api/v1/schools
    ↑
    No authentication required
    Backend uses SERVICE_KEY for internal fetch
    
POST /enrollment/auto-save
    ↑
    Requires JWT Bearer token
    Backend validates token and extracts user_id
    RLS enforces data isolation
```

---

## 📈 Data Relationships

```
auth.users (Supabase Auth)
    ↓
    |-- 1:1 → applications
            ├── 1:1 → students
            ├── 1:1 → medical_info
            ├── 1:1 → parents
            ├── 1:N → next_of_kin
            ├── 1:1 → fee_responsibility
            ├── 1:N → academic_history
            ├── 1:1 → declarations
            ├── 1:1 → financing_selections
            └── 1:N → application_documents
```

---

## 🔄 Migration Strategy

### Primary Database Migrations:
Located in `backend/db/migrations/`:
1. `001_master_schema.sql` - Core tables and RLS setup
2. `002_school_fees.sql` - Fee-related tables
3. `003_uploaded_files_with_summary_view.sql` - Document views
4. `004_fix_rls_policies.sql` - RLS policy refinements
5. `005-009_*.sql` - Schema refinements

### Schools Database:
Managed separately through Supabase Dashboard or admin tools.

---

## 🚀 Implementation Notes

### Backend API Endpoint for Schools:
```python
@router.get("/schools", response_model=dict)
async def get_schools():
    """Get list of all schools from dedicated schools database"""
    schools_url = os.getenv("SCHOOLS_SUPABASE_URL")
    schools_service_key = os.getenv("SCHOOLS_SUPABASE_SERVICE_KEY")
    
    schools_client = create_client(schools_url, schools_service_key)
    response = schools_client.table("Schools")
        .select("id, schoolName")
        .order("schoolName")
        .execute()
    
    return {
        "data": response.data,
        "count": len(response.data)
    }
```

### Frontend Usage:
```typescript
useEffect(() => {
    const loadSchools = async () => {
        const response = await fetch(`${VITE_API_BASE_URL}/schools`);
        const data = await response.json();
        setSchools(data.data);
    };
    loadSchools();
}, []);
```

---

## 📋 Summary Table

| Aspect | Enrollment DB | Schools DB |
|--------|--------------|-----------|
| **URL** | guucarfnghsgisvdoxnt | sndfrorebebtulfvzbyu |
| **Purpose** | User enrollment data | Reference schools |
| **RLS** | ✅ Enabled | ❌ Not needed |
| **Access** | JWT + Service Key | Service Key only |
| **User Isolation** | ✅ Per-user RLS | N/A (shared data) |
| **Write Access** | Backend (parents service) | Admin only |
| **Read Access** | Backend + Frontend (via JWT) | Backend API only |
| **Update Frequency** | Real-time | Infrequent |

---

## ✅ Best Practices Implemented

1. ✅ **Separation of Concerns:** Enrollment and reference data kept separate
2. ✅ **Service Key for Backend:** Bypasses RLS for authorized backend operations
3. ✅ **Anon Key for Frontend:** Limited to authenticated user operations
4. ✅ **API Gateway:** Backend acts as intermediary for schools data
5. ✅ **RLS at Database Level:** Primary security enforcement
6. ✅ **Audit Trail:** All tables have created_at/updated_at timestamps
7. ✅ **Referential Integrity:** Foreign key constraints ensure data consistency
