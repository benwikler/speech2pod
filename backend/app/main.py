from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Speech2Pod")

# CORS - allow Vercel and vilas.live domains
frontend_url = os.getenv("FRONTEND_URL", "")
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://speeches.vilas.live",
    "https://www.speeches.vilas.live",
    "https://vilas.live",
]
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.(vercel\.app|vilas\.live)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"name": "Speech2Pod", "status": "running"}

# Load routers after health endpoint is defined
try:
    from app.database import init_db
    init_db()

    from app.routers import analyze_router, extract_router, episodes_router, feed_router
    app.include_router(analyze_router)
    app.include_router(extract_router)
    app.include_router(episodes_router)
    app.include_router(feed_router)
except Exception as e:
    print(f"Error loading routers: {e}")
    import traceback
    traceback.print_exc()
