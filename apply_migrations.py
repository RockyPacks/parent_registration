#!/usr/bin/env python3
"""
Quick migration applier using direct PostgreSQL connection.
This script applies pending migrations from db/migrations/ directory.

Usage:
    python3 apply_migrations.py
    
Requirements:
    pip install psycopg2-binary
"""

import os
import sys
from pathlib import Path
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_database_url():
    """Extract PostgreSQL connection URL from Supabase config."""
    # Supabase connection string format:
    # postgresql://[user]:[password]@[host]:[port]/[database]
    
    # Get from environment - typically in .env as DATABASE_URL or similar
    db_url = os.environ.get('DATABASE_URL')
    if db_url:
        return db_url
    
    # Alternative: construct from Supabase config
    supabase_url = os.environ.get('SUPABASE_URL')
    if not supabase_url:
        return None
    
    # Extract host from supabase_url (https://xxx.supabase.co)
    # But Supabase projects use PostgreSQL on postgrest.supabase.co
    # You need to get the actual DB connection string from Project Settings > Database
    return None

def apply_migrations():
    """Apply all pending migrations."""
    try:
        import psycopg2
        from psycopg2 import sql
    except ImportError:
        logger.error("psycopg2 not installed. Install with: pip install psycopg2-binary")
        sys.exit(1)
    
    # For Supabase, get connection string from:
    # 1. Project Settings > Database > Connection pooling > Connection string
    # 2. Or use: postgresql://postgres:[password]@[host]:[port]/postgres
    
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        logger.error("""
DATABASE_URL not found in environment.

For Supabase:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click 'Settings' > 'Database'
4. Copy the 'Connection string' (URI)
5. Add to .env: DATABASE_URL=<paste_here>
6. Or set environment: export DATABASE_URL=<paste_here>
        """)
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        logger.info("Connected to database")
        
        # Get migration files
        migrations_dir = Path(__file__).parent / "backend" / "db" / "migrations"
        migration_files = sorted(migrations_dir.glob("*.sql"))
        
        applied_count = 0
        for migration_file in migration_files:
            logger.info(f"Applying migration: {migration_file.name}")
            
            with open(migration_file, 'r') as f:
                migration_sql = f.read()
            
            try:
                cursor.execute(migration_sql)
                conn.commit()
                applied_count += 1
                logger.info(f"✓ Successfully applied: {migration_file.name}")
            except Exception as e:
                conn.rollback()
                logger.error(f"✗ Failed to apply {migration_file.name}: {str(e)}")
                # Continue with next migration
        
        cursor.close()
        conn.close()
        
        logger.info(f"\nMigrations completed: {applied_count}/{len(migration_files)} applied")
        
    except psycopg2.Error as e:
        logger.error(f"Database error: {str(e)}")
        logger.error("""
Connection failed. Make sure:
1. DATABASE_URL is set correctly
2. PostgreSQL server is running
3. Credentials are valid
        """)
        sys.exit(1)

if __name__ == "__main__":
    apply_migrations()
