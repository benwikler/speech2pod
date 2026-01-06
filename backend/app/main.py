from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.database import init_db
from app.routers import (
    analyze_router,
    extract_router,
    episodes_router,
    feed_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database
    init_db()
    yield
    # Shutdown: cleanup if needed
    pass


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Convert YouTube videos to podcast episodes",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for frontend
# In production, set FRONTEND_URL environment variable
import os
frontend_url = os.getenv("FRONTEND_URL", "")
allowed_origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",
]
if frontend_url:
    allowed_origins.append(frontend_url)
# Allow any vercel.app subdomain
allowed_origins.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze_router)
app.include_router(extract_router)
app.include_router(episodes_router)
app.include_router(feed_router)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
