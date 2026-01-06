from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.database import Base


class EpisodeStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True, index=True)

    # YouTube source
    youtube_id = Column(String(20), index=True)
    youtube_url = Column(String(500))
    original_title = Column(String(500))
    original_description = Column(Text)

    # Generated metadata
    title = Column(String(500))
    speaker = Column(String(200))
    speech_date = Column(String(50))  # Stored as string for flexibility
    venue = Column(String(300))
    topic = Column(String(300))
    summary = Column(Text)

    # Audio
    audio_url = Column(String(500))
    audio_duration = Column(Float)  # seconds
    thumbnail_url = Column(String(500))

    # Crop settings
    crop_start = Column(Float, default=0.0)
    crop_end = Column(Float, nullable=True)  # null = no crop

    # Extensibility: Intro/outro audio
    intro_audio_url = Column(String(500), nullable=True)
    outro_audio_url = Column(String(500), nullable=True)
    use_ai_intro = Column(String(50), default="none")  # none, elevenlabs, openai

    # Status
    status = Column(SQLEnum(EpisodeStatus), default=EpisodeStatus.DRAFT)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "youtube_id": self.youtube_id,
            "youtube_url": self.youtube_url,
            "original_title": self.original_title,
            "title": self.title,
            "speaker": self.speaker,
            "speech_date": self.speech_date,
            "venue": self.venue,
            "topic": self.topic,
            "summary": self.summary,
            "audio_url": self.audio_url,
            "audio_duration": self.audio_duration,
            "thumbnail_url": self.thumbnail_url,
            "crop_start": self.crop_start,
            "crop_end": self.crop_end,
            "intro_audio_url": self.intro_audio_url,
            "outro_audio_url": self.outro_audio_url,
            "use_ai_intro": self.use_ai_intro,
            "status": self.status.value if self.status else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "published_at": self.published_at.isoformat() if self.published_at else None,
        }


class ExtractionJob(Base):
    __tablename__ = "extraction_jobs"

    id = Column(String(36), primary_key=True)  # UUID
    youtube_id = Column(String(20), index=True)
    status = Column(SQLEnum(JobStatus), default=JobStatus.PENDING)

    # Results
    audio_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    duration = Column(Float, nullable=True)
    waveform_data = Column(Text, nullable=True)  # JSON array of amplitude values

    # Silence detection
    detected_start_silence = Column(Float, default=0.0)
    detected_end_silence = Column(Float, default=0.0)

    # Error info
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
