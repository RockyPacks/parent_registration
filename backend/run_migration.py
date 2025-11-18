#!/usr/bin/env python3
"""
Script to run database migrations for the enrollment system.
"""

import sys
import os
import argparse
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.supabase_client import supabase
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration(file_path):
    """Run the specified migration file."""
    try:
        # Read the migration SQL
        with open(file_path, 'r') as f:
            migration_sql = f.read()

        logger.info(f"Running migration from {file_path}...")

        # Execute the migration
        # Note: Supabase doesn't support direct SQL execution via the Python client
        # We'll need to run this manually in the Supabase dashboard or use psycopg2
        # For now, let's try using the rpc function if available

        # Alternative: Use the Supabase REST API to execute raw SQL
        # But for now, we'll provide instructions

        logger.info("Migration SQL to execute:")
        logger.info(migration_sql)
        logger.info("\nPlease execute this SQL in your Supabase SQL editor or dashboard.")
        logger.info("The migration will create missing tables including the next_of_kin table.")

        return True

    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run database migrations')
    parser.add_argument('--file', required=True, help='Path to the migration SQL file')
    args = parser.parse_args()

    success = run_migration(args.file)
    sys.exit(0 if success else 1)
