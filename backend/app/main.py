from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

print("=== STARTING SPEECH2POD ===", file=sys.stderr, flush=True)

app = FastAPI(
    title="Speech2Pod",
    description="Convert YouTube videos to podcast episodes",
    version="1.0.0"
)

# CORS
frontend_url = os.getenv("FRONTEND_URL", "")
allowed_origins = ["http://localhost:5173", "http://localhost:3000"]
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"name": "Speech2Pod", "version": "1.0.0", "status": "running"}

# Load routers
try:
    print("Loading database...", file=sys.stderr, flush=True)
    from app.database import init_db
    init_db()
    print("Database initialized", file=sys.stderr, flush=True)

    print("Loading routers...", file=sys.stderr, flush=True)
    from app.routers import analyze_router, extract_router, episodes_router, feed_router
    app.include_router(analyze_router)
    app.include_router(extract_router)
    app.include_router(episodes_router)
    app.include_router(feed_router)
    print("Routers loaded", file=sys.stderr, flush=True)
except Exception as e:
    print(f"STARTUP ERROR: {e}", file=sys.stderr, flush=True)
    import traceback
    traceback.print_exc()

print("=== APP READY ===", file=sys.stderr, flush=True)
