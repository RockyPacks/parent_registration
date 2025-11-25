import os
from fastapi import FastAPI

app = FastAPI()

@app.get("/env")
async def read_env():
    return {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_ANON_KEY": os.getenv("SUPABASE_ANON_KEY"),
        "SUPABASE_SERVICE_ROLE_KEY": os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        "SUPABASE_JWT_SECRET": os.getenv("SUPABASE_JWT_SECRET")
    }
