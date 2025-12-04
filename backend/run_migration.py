import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# Get Supabase credentials
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

print(f"🔗 Connecting to Supabase: {supabase_url}")

# Create Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

# Fee data from 2026 schedule
fee_data = [
    # Grade R
    {"grade": "Grade R", "annual_fee": 14400, "term_fee": 3600, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    # Grades 1-6
    {"grade": "Grade 1", "annual_fee": 20400, "term_fee": 5100, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    {"grade": "Grade 2", "annual_fee": 20400, "term_fee": 5100, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    {"grade": "Grade 3", "annual_fee": 20400, "term_fee": 5100, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    {"grade": "Grade 4", "annual_fee": 20400, "term_fee": 5100, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    {"grade": "Grade 5", "annual_fee": 20400, "term_fee": 5100, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    {"grade": "Grade 6", "annual_fee": 20400, "term_fee": 5100, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    # Grades 7-9
    {"grade": "Grade 7", "annual_fee": 26400, "term_fee": 6600, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    {"grade": "Grade 8", "annual_fee": 26400, "term_fee": 6600, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    {"grade": "Grade 9", "annual_fee": 26400, "term_fee": 6600, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    # Grades 10-11
    {"grade": "Grade 10", "annual_fee": 30000, "term_fee": 7500, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    {"grade": "Grade 11", "annual_fee": 30000, "term_fee": 7500, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
    # Grade 12
    {"grade": "Grade 12", "annual_fee": 32400, "term_fee": 8100, "registration_fee": 800, "re_registration_fee": 400, "sport_fee": 0},
]

print(f"\n�� Inserting {len(fee_data)} grade fee records...")

success_count = 0
error_count = 0

for fee in fee_data:
    try:
        # Try to insert, if exists, update
        result = supabase.table("school_fees").upsert(
            fee,
            on_conflict="grade"
        ).execute()
        
        print(f"✅ {fee['grade']}: R{fee['annual_fee']:,} annually (R{fee['term_fee']:,} per term)")
        success_count += 1
    except Exception as e:
        print(f"❌ Error inserting {fee['grade']}: {str(e)}")
        error_count += 1

print(f"\n{'='*60}")
print(f"✨ Migration Complete!")
print(f"✅ Successfully inserted: {success_count} records")
if error_count > 0:
    print(f"❌ Errors: {error_count}")
print(f"{'='*60}\n")

# Verify the data
print("🔍 Verifying inserted data...")
try:
    result = supabase.table("school_fees").select("grade, annual_fee, term_fee").order("grade").execute()
    print(f"\n📋 Total records in database: {len(result.data)}\n")
    for record in result.data:
        print(f"  • {record['grade']}: R{record['annual_fee']:,} annually")
except Exception as e:
    print(f"❌ Error verifying data: {str(e)}")

print("\n🎉 Dynamic School Fees System is now live!")
print("🚀 The API endpoints are ready to serve grade-specific fees.\n")
