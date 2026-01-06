from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models.episode import Episode, EpisodeStatus

router = APIRouter(prefix="/api", tags=["episodes"])


class EpisodeCreate(BaseModel):
    youtube_id: str
    youtube_url: str
    original_title: str
    original_description: Optional[str] = None
    title: str
    speaker: str
    speech_date: str
    venue: str
    topic: str
    summary: str
    audio_url: str
    audio_duration: float
    thumbnail_url: str
    crop_start: float = 0.0
    crop_end: Optional[float] = None
    status: str = "draft"  # draft or published


class EpisodeUpdate(BaseModel):
    title: Optional[str] = None
    speaker: Optional[str] = None
    speech_date: Optional[str] = None
    venue: Optional[str] = None
    topic: Optional[str] = None
    summary: Optional[str] = None
    audio_url: Optional[str] = None
    audio_duration: Optional[float] = None
    thumbnail_url: Optional[str] = None
    crop_start: Optional[float] = None
    crop_end: Optional[float] = None
    status: Optional[str] = None
    intro_audio_url: Optional[str] = None
    outro_audio_url: Optional[str] = None
    use_ai_intro: Optional[str] = None


class EpisodeResponse(BaseModel):
    id: int
    youtube_id: str
    youtube_url: str
    original_title: str
    title: str
    speaker: str
    speech_date: str
    venue: str
    topic: str
    summary: str
    audio_url: str
    audio_duration: float
    thumbnail_url: str
    crop_start: float
    crop_end: Optional[float]
    intro_audio_url: Optional[str]
    outro_audio_url: Optional[str]
    use_ai_intro: str
    status: str
    created_at: str
    updated_at: Optional[str]
    published_at: Optional[str]


@router.post("/episodes", response_model=EpisodeResponse)
async def create_episode(episode: EpisodeCreate, db: Session = Depends(get_db)):
    """Create a new episode (draft or published)."""
    status = EpisodeStatus.PUBLISHED if episode.status == "published" else EpisodeStatus.DRAFT

    db_episode = Episode(
        youtube_id=episode.youtube_id,
        youtube_url=episode.youtube_url,
        original_title=episode.original_title,
        original_description=episode.original_description,
        title=episode.title,
        speaker=episode.speaker,
        speech_date=episode.speech_date,
        venue=episode.venue,
        topic=episode.topic,
        summary=episode.summary,
        audio_url=episode.audio_url,
        audio_duration=episode.audio_duration,
        thumbnail_url=episode.thumbnail_url,
        crop_start=episode.crop_start,
        crop_end=episode.crop_end,
        status=status,
        published_at=datetime.now(timezone.utc) if status == EpisodeStatus.PUBLISHED else None
    )

    db.add(db_episode)
    db.commit()
    db.refresh(db_episode)

    return _episode_to_response(db_episode)


@router.get("/episodes", response_model=List[EpisodeResponse])
async def list_episodes(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all episodes, optionally filtered by status."""
    query = db.query(Episode)

    if status:
        if status == "published":
            query = query.filter(Episode.status == EpisodeStatus.PUBLISHED)
        elif status == "draft":
            query = query.filter(Episode.status == EpisodeStatus.DRAFT)

    episodes = query.order_by(Episode.created_at.desc()).all()
    return [_episode_to_response(ep) for ep in episodes]


@router.get("/episodes/{episode_id}", response_model=EpisodeResponse)
async def get_episode(episode_id: int, db: Session = Depends(get_db)):
    """Get a single episode by ID."""
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")
    return _episode_to_response(episode)


@router.put("/episodes/{episode_id}", response_model=EpisodeResponse)
async def update_episode(
    episode_id: int,
    update: EpisodeUpdate,
    db: Session = Depends(get_db)
):
    """Update an episode."""
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")

    update_data = update.model_dump(exclude_unset=True)

    # Handle status change
    if "status" in update_data:
        new_status = update_data.pop("status")
        if new_status == "published":
            episode.status = EpisodeStatus.PUBLISHED
            if not episode.published_at:
                episode.published_at = datetime.now(timezone.utc)
        else:
            episode.status = EpisodeStatus.DRAFT

    # Update other fields
    for field, value in update_data.items():
        setattr(episode, field, value)

    db.commit()
    db.refresh(episode)

    return _episode_to_response(episode)


@router.delete("/episodes/{episode_id}")
async def delete_episode(episode_id: int, db: Session = Depends(get_db)):
    """Delete an episode."""
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")

    db.delete(episode)
    db.commit()

    return {"message": "Episode deleted"}


@router.post("/episodes/{episode_id}/publish", response_model=EpisodeResponse)
async def publish_episode(episode_id: int, db: Session = Depends(get_db)):
    """Publish a draft episode."""
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")

    episode.status = EpisodeStatus.PUBLISHED
    episode.published_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(episode)

    return _episode_to_response(episode)


@router.post("/episodes/{episode_id}/unpublish", response_model=EpisodeResponse)
async def unpublish_episode(episode_id: int, db: Session = Depends(get_db)):
    """Unpublish an episode (move to draft)."""
    episode = db.query(Episode).filter(Episode.id == episode_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")

    episode.status = EpisodeStatus.DRAFT

    db.commit()
    db.refresh(episode)

    return _episode_to_response(episode)


def _episode_to_response(episode: Episode) -> EpisodeResponse:
    """Convert Episode model to response schema."""
    return EpisodeResponse(
        id=episode.id,
        youtube_id=episode.youtube_id,
        youtube_url=episode.youtube_url,
        original_title=episode.original_title,
        title=episode.title,
        speaker=episode.speaker,
        speech_date=episode.speech_date,
        venue=episode.venue,
        topic=episode.topic,
        summary=episode.summary,
        audio_url=episode.audio_url,
        audio_duration=episode.audio_duration,
        thumbnail_url=episode.thumbnail_url,
        crop_start=episode.crop_start,
        crop_end=episode.crop_end,
        intro_audio_url=episode.intro_audio_url,
        outro_audio_url=episode.outro_audio_url,
        use_ai_intro=episode.use_ai_intro or "none",
        status=episode.status.value,
        created_at=episode.created_at.isoformat() if episode.created_at else "",
        updated_at=episode.updated_at.isoformat() if episode.updated_at else None,
        published_at=episode.published_at.isoformat() if episode.published_at else None,
    )
