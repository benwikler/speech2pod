from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.youtube import YouTubeService
from app.services.ai import AIService

router = APIRouter(prefix="/api", tags=["analyze"])


class AnalyzeRequest(BaseModel):
    url: str


class GeneratedMetadataResponse(BaseModel):
    speaker: str
    date: str
    venue: str
    topic: str
    summary: str
    suggested_title: str


class AnalyzeResponse(BaseModel):
    youtube_id: str
    original_title: str
    description: str
    thumbnail_url: str
    duration_seconds: int
    upload_date: str
    uploader: str
    generated_metadata: GeneratedMetadataResponse


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_video(request: AnalyzeRequest):
    """
    Analyze a YouTube URL and generate podcast metadata.
    """
    # Extract video ID
    video_id = YouTubeService.extract_video_id(request.url)
    if not video_id:
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    try:
        # Get YouTube metadata
        yt_metadata = YouTubeService.get_metadata(request.url)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to fetch YouTube video: {str(e)}"
        )

    try:
        # Generate AI metadata
        print(f"Calling AI service for video: {yt_metadata.title}")
        ai_service = AIService()
        generated = ai_service.generate_metadata(
            title=yt_metadata.title,
            description=yt_metadata.description,
            uploader=yt_metadata.uploader,
            upload_date=yt_metadata.upload_date,
            youtube_url=request.url,
        )
        print(f"AI returned: speaker={generated.speaker}, venue={generated.venue}")
    except Exception as e:
        # Fall back to basic metadata if AI fails
        print(f"AI service failed with error: {e}")
        import traceback
        traceback.print_exc()
        generated = GeneratedMetadataResponse(
            speaker=yt_metadata.uploader,
            date=yt_metadata.upload_date,
            venue="Unknown",
            topic="Speech",
            summary=yt_metadata.description[:200] if yt_metadata.description else "",
            suggested_title=yt_metadata.title
        )

    return AnalyzeResponse(
        youtube_id=yt_metadata.video_id,
        original_title=yt_metadata.title,
        description=yt_metadata.description or "",
        thumbnail_url=yt_metadata.thumbnail_url,
        duration_seconds=yt_metadata.duration,
        upload_date=yt_metadata.upload_date,
        uploader=yt_metadata.uploader,
        generated_metadata=GeneratedMetadataResponse(
            speaker=generated.speaker,
            date=generated.date,
            venue=generated.venue,
            topic=generated.topic,
            summary=generated.summary,
            suggested_title=generated.suggested_title,
        )
    )
