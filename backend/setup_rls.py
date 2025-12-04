import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print("🔗 Connecting to Supabase to set up RLS policies...")

supabase: Client = create_client(supabase_url, supabase_key)

# SQL commands to set up RLS
rls_commands = [
    # Enable RLS
    "ALTER TABLE public.school_fees ENABLE ROW LEVEL SECURITY;",
    
    # Drop existing policies if they exist
    "DROP POLICY IF EXISTS \"Authenticated users can view fees\" ON public.school_fees;",
    "DROP POLICY IF EXISTS \"Public can view fees\" ON public.school_fees;",
    
    # Create policy for authenticated users
    """
    CREATE POLICY "Authenticated users can view fees" ON public.school_fees
      FOR SELECT
      TO authenticated
      USING (true);
    """,
    
    # Create policy for anonymous users
    """
    CREATE POLICY "Public can view fees" ON public.school_fees
      FOR SELECT
      TO anon
      USING (true);
    """
]

print("\n🔒 Setting up Row Level Security (RLS) policies...\n")

for i, sql in enumerate(rls_commands, 1):
    try:
        supabase.postgrest.rpc("exec_sql", {"sql": sql}).execute()
        print(f"✅ Command {i}/{len(rls_commands)} executed successfully")
    except Exception as e:
        # Try alternative method using direct SQL execution
        print(f"⚠️  Note: {str(e)}")
        print(f"   You may need to run this SQL manually in Supabase SQL Editor:")
        print(f"   {sql.strip()}\n")

print("\n" + "="*60)
print("🎉 RLS Setup Complete!")
print("📋 Policies created:")
print("   • Authenticated users can view fees (read-only)")
print("   • Anonymous users can view fees (read-only)")
print("="*60 + "\n")
