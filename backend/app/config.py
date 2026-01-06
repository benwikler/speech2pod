from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
import os
from dotenv import load_dotenv

# Load .env from parent directory or current directory
env_path = Path(__file__).parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    load_dotenv()  # Try current directory


class Settings(BaseSettings):
    # App
    app_name: str = "Speech2Pod"
    debug: bool = False

    # Database
    database_url: str = "sqlite:///./data/speech2pod.db"

    # Cloudflare R2
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "speech2pod"
    r2_public_url: str = ""  # e.g., https://pub-xxx.r2.dev or custom domain

    # Claude API
    anthropic_api_key: str = ""

    # Podcast Feed
    podcast_title: str = "Speech2Pod"
    podcast_description: str = "Political speeches converted to podcast format"
    podcast_author: str = "Speech2Pod"
    podcast_email: str = "podcast@example.com"
    podcast_image_url: str = ""
    podcast_base_url: str = ""  # Base URL for the feed (e.g., https://your-app.railway.app)

    # Audio Processing
    audio_bitrate: str = "192k"
    audio_sample_rate: int = 44100
    loudness_target: float = -16.0  # LUFS

    # Future: AI Voice (extensibility)
    elevenlabs_api_key: str = ""
    openai_api_key: str = ""

    class Config:
        # Look for .env in parent directory (speech2pod/) or current directory
        env_file = "../.env" if os.path.exists("../.env") else ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
