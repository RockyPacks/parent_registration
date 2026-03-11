#!/usr/bin/env python3
"""
Migration runner script for applying SQL migrations to the database.
This script reads migration files from db/migrations/ and applies them in order.
"""

import os
import sys
import logging
from pathlib import Path
import importlib.util

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import Supabase client
from app.core.config import settings
from supabase import create_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_migration_files():
    """Get all migration files in db/migrations directory, sorted by number."""
    migrations_dir = Path(__file__).parent / "db" / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))
    return migration_files

def read_migration_file(filepath):
    """Read SQL migration file and return content."""
    with open(filepath, 'r') as f:
        return f.read()

def run_migration(sql_content):
    """
    Execute SQL migration using Supabase service client.
    Supabase SQL Editor can run raw SQL through the service role.
    """
    try:
        # Initialize Supabase service client
        supabase_url = settings.supabase_url
        supabase_service_key = settings.supabase_service_key
        
        if not supabase_url or not supabase_service_key:
            logger.error("Supabase configuration missing. Check .env file.")
            return False
        
        supabase = create_client(supabase_url, supabase_service_key)
        
        # Note: Supabase Python client doesn't have direct SQL execution.
        # You need to execute this through:
        # 1. Supabase SQL Editor (https://supabase.com/dashboard/project/[project]/sql/new)
        # 2. Direct PostgreSQL connection with psycopg2
        # 3. Supabase CLI: supabase migration up
        
        logger.info("Migration script requires manual execution through Supabase SQL Editor")
        logger.info("or via PostgSQL direct connection using psycopg2")
        return False
        
    except Exception as e:
        logger.error(f"Error running migration: {str(e)}")
        return False

def main():
    """Main migration runner."""
    logger.info("Starting database migration runner...")
    
    migration_files = get_migration_files()
    if not migration_files:
        logger.warning("No migration files found")
        return
    
    logger.info(f"Found {len(migration_files)} migration file(s)")
    
    print("\n=== DATABASE MIGRATION INFORMATION ===\n")
    print("To execute migrations, you have the following options:\n")
    
    print("Option 1: Supabase SQL Editor (Easiest)")
    print("1. Go to https://supabase.com/dashboard")
    print("2. Select your project")
    print("3. Click 'SQL Editor' on the left sidebar")
    print("4. Click 'New Query' or 'New Snippet'")
    print("5. Copy and paste the SQL from the migration files below")
    print("6. Click 'Run'\n")
    
    print("Option 2: Using psycopg2 (Python)")
    print("1. Install: pip install psycopg2-binary")
    print("2. Modify this script to include PostgreSQL connection logic\n")
    
    print("Option 3: Supabase CLI")
    print("1. Install: npm install -g supabase")
    print("2. Run: supabase migration up\n")
    
    print("=== MIGRATION FILES ===\n")
    
    for i, migration_file in enumerate(migration_files, 1):
        logger.info(f"{i}. {migration_file.name}")
        print(f"\n--- Migration {i}: {migration_file.name} ---")
        content = read_migration_file(migration_file)
        print(content)
    
    print("\n=== END OF MIGRATIONS ===\n")
    logger.info("Please execute the above migrations in Supabase SQL Editor")

if __name__ == "__main__":
    main()
