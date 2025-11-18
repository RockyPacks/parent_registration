import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.db.supabase_client import supabase

async def test_supabase():
    try:
        print("Testing Supabase connection...")
        # Test a simple query
        result = supabase.from_('applications').select('*').limit(1)
        response = result.execute()
        if response.data:
            print("✅ Supabase query successful:", len(response.data), "records found")
        else:
            print("❌ No data returned or error:", response.error)
    except Exception as e:
        print("❌ Error testing Supabase:", str(e))

if __name__ == "__main__":
    asyncio.run(test_supabase())
