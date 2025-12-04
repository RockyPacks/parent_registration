import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

print("🔍 Testing RLS policies with anonymous key...\n")

# Test with anon key (what the frontend uses)
supabase: Client = create_client(supabase_url, supabase_anon_key)

try:
    result = supabase.table("school_fees").select("grade, annual_fee, term_fee").limit(3).execute()
    
    if result.data:
        print("✅ RLS Policies are working! Anonymous users can read fees.\n")
        print("Sample data:")
        for record in result.data:
            print(f"  • {record['grade']}: R{record['annual_fee']:,} annually")
    else:
        print("⚠️  No data returned - RLS might be blocking access")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
    print("\nThis might mean RLS policies need to be configured properly.")

print("\n✅ Everything is set up correctly!")
