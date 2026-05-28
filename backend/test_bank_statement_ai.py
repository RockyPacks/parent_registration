import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Setup paths so we can import app modules
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from app.db.supabase_client import supabase_service
from app.services.bank_statement_service import bank_statement_service

def run_test():
    print("🔍 Fetching an uploaded bank statement from the database...")
    
    # Check if Supabase is connected
    if not supabase_service:
        print("❌ Supabase service client not initialized. Check your .env file.")
        return
        
    # Fetch a record from application_documents and look inside the JSON files array
    result = supabase_service.table("application_documents").select("*").limit(10).execute()
    
    file_record = None
    application_id = None
    user_id = None

    for doc in result.data:
        files = doc.get("files", [])
        if isinstance(files, list):
            for f in files:
                # Some objects have document_type
                if f.get("document_type") in ["bank_statement", "bank-statements", "bank_statements"]:
                    file_record = f
                    application_id = doc.get("application_id")
                    user_id = doc.get("user_id")
                    break
        if file_record:
            break
    
    if not file_record:
        print("❌ No bank statements found in the 'application_documents' files arrays.")
        print("Please log in to the frontend, go to the document upload section, and upload a test bank statement PDF first.")
        return

    file_id = file_record["id"]

    
    print(f"📄 Found file: {file_record['original_filename']}")
    print(f"   - File ID: {file_id}")
    print(f"   - Application ID: {application_id}")
    print(f"🤖 Starting AI Analysis via OpenAI (this may take 15-40 seconds)...")
    
    try:
        # Run the AI service
        bank_statement_service.analyse_bank_statement(
            application_id=application_id, 
            file_id=file_id, 
            user_id=user_id
        )
        
        # Fetch the results from the new database table
        print("✅ Service finished! Fetching results from 'bank_statement_analyses' table...")
        analysis_result = supabase_service.table("bank_statement_analyses").select("*").eq("file_id", file_id).order('created_at', desc=True).limit(1).execute()
        
        if analysis_result.data:
            record = analysis_result.data[0]
            print(f"\n📊 --- ANALYSIS RESULTS ---")
            print(f"Status: {record['status']}")
            
            if record['status'] == 'error':
                print(f"Error Message: {record['error_message']}")
            else:
                print(f"Risk Score:  {record.get('risk_score')}/100")
                print(f"Flags:       {record.get('flags')}")
                print(f"AI Summary:  {record.get('ai_summary')}")
                
                import json
                print("\nFull Extracted JSON:")
                print(json.dumps(record.get('result_json'), indent=2))
        else:
            print("❌ No record found in bank_statement_analyses table after running.")
            
    except Exception as e:
        print(f"❌ Error during execution: {e}")

if __name__ == "__main__":
    run_test()
