from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.episode import Episode, EpisodeStatus
from app.services.feed import FeedService

router = APIRouter(tags=["feed"])


@router.get("/api/feed.xml")
@router.get("/feed.xml")
async def get_podcast_feed(db: Session = Depends(get_db)):
    """
    Get the RSS podcast feed.
    This endpoint is publicly accessible for podcast apps.
    """
    # Get all published episodes
    episodes = (
        db.query(Episode)
        .filter(Episode.status == EpisodeStatus.PUBLISHED)
        .order_by(Episode.published_at.desc())
        .all()
    )

    # Generate RSS feed
    feed_service = FeedService()
    feed_xml = feed_service.generate_feed(episodes)

    return Response(
        content=feed_xml,
        media_type="application/rss+xml",
        headers={
            "Cache-Control": "public, max-age=300",  # Cache for 5 minutes
        }
    )


@router.get("/api/feed/info")
async def get_feed_info(db: Session = Depends(get_db)):
    """Get information about the podcast feed."""
    from app.config import get_settings
    settings = get_settings()

    published_count = (
        db.query(Episode)
        .filter(Episode.status == EpisodeStatus.PUBLISHED)
        .count()
    )

    draft_count = (
        db.query(Episode)
        .filter(Episode.status == EpisodeStatus.DRAFT)
        .count()
    )

    return {
        "title": settings.podcast_title,
        "description": settings.podcast_description,
        "feed_url": f"{settings.podcast_base_url}/api/feed.xml",
        "published_episodes": published_count,
        "draft_episodes": draft_count,
    }
