from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
import uuid
import tempfile
import os
import json
from datetime import datetime, timezone

from app.database import get_db
from app.models.episode import ExtractionJob, JobStatus
from app.services.youtube import YouTubeService
from app.services.audio import AudioService
from app.services.storage import StorageService

router = APIRouter(prefix="/api", tags=["extract"])


class ExtractRequest(BaseModel):
    youtube_id: str
    youtube_url: str


class ExtractResponse(BaseModel):
    job_id: str
    status: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    audio_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration: Optional[float] = None
    waveform_data: Optional[List[float]] = None
    detected_silence: Optional[dict] = None
    error_message: Optional[str] = None


class CropRequest(BaseModel):
    job_id: str
    start_time: float
    end_time: float


class CropResponse(BaseModel):
    audio_url: str
    duration: float


def process_extraction(
    job_id: str,
    youtube_url: str,
    db_url: str
):
    """Background task to extract and process audio."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    # Create new session for background task
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Update job status
        job = db.query(ExtractionJob).filter(ExtractionJob.id == job_id).first()
        if not job:
            return

        job.status = JobStatus.PROCESSING
        db.commit()

        # Create temp directory for processing
        temp_dir = tempfile.mkdtemp()

        try:
            # Download audio from YouTube
            audio_path, thumbnail_path = YouTubeService.download_audio(
                youtube_url, temp_dir
            )

            # Process audio (normalize, trim silence)
            audio_service = AudioService()
            result = audio_service.process_audio(
                audio_path,
                normalize=True,
                trim_silence=True
            )

            # Upload to R2
            storage = StorageService()
            audio_url = storage.upload_audio(result.output_path, job_id)

            thumbnail_url = ""
            if os.path.exists(thumbnail_path):
                thumbnail_url = storage.upload_thumbnail(thumbnail_path, job_id)

            # Update job with results
            job.status = JobStatus.COMPLETED
            job.audio_url = audio_url
            job.thumbnail_url = thumbnail_url
            job.duration = result.duration
            job.waveform_data = json.dumps(result.waveform)
            job.detected_start_silence = result.silence_start
            job.detected_end_silence = result.silence_end
            job.completed_at = datetime.now(timezone.utc)
            db.commit()

        finally:
            # Cleanup temp files
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)

    except Exception as e:
        job.status = JobStatus.FAILED
        job.error_message = str(e)
        db.commit()
    finally:
        db.close()


@router.post("/extract", response_model=ExtractResponse)
async def start_extraction(
    request: ExtractRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Start audio extraction job for a YouTube video.
    Returns job ID for polling status.
    """
    from app.config import get_settings
    settings = get_settings()

    # Create job record
    job_id = str(uuid.uuid4())
    job = ExtractionJob(
        id=job_id,
        youtube_id=request.youtube_id,
        status=JobStatus.PENDING
    )
    db.add(job)
    db.commit()

    # Start background processing
    background_tasks.add_task(
        process_extraction,
        job_id,
        request.youtube_url,
        settings.database_url
    )

    return ExtractResponse(job_id=job_id, status="processing")


@router.get("/extract/{job_id}", response_model=JobStatusResponse)
async def get_extraction_status(job_id: str, db: Session = Depends(get_db)):
    """Get status of an extraction job."""
    job = db.query(ExtractionJob).filter(ExtractionJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    waveform = None
    if job.waveform_data:
        try:
            waveform = json.loads(job.waveform_data)
        except json.JSONDecodeError:
            pass

    return JobStatusResponse(
        job_id=job.id,
        status=job.status.value,
        audio_url=job.audio_url,
        thumbnail_url=job.thumbnail_url,
        duration=job.duration,
        waveform_data=waveform,
        detected_silence={
            "start_trim": job.detected_start_silence,
            "end_trim": job.detected_end_silence
        } if job.detected_start_silence or job.detected_end_silence else None,
        error_message=job.error_message
    )


@router.post("/crop", response_model=CropResponse)
async def crop_audio(request: CropRequest, db: Session = Depends(get_db)):
    """
    Crop audio to specified start and end times.
    Creates a new audio file with the cropped content.
    """
    job = db.query(ExtractionJob).filter(ExtractionJob.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.audio_url:
        raise HTTPException(status_code=400, detail="No audio available")

    # Download the current audio
    import httpx
    temp_dir = tempfile.mkdtemp()

    try:
        input_path = os.path.join(temp_dir, "input.mp3")
        output_path = os.path.join(temp_dir, "output.mp3")

        # Download audio from storage
        async with httpx.AsyncClient() as client:
            response = await client.get(job.audio_url)
            with open(input_path, 'wb') as f:
                f.write(response.content)

        # Crop audio
        audio_service = AudioService()
        audio_service.crop_audio(
            input_path,
            request.start_time,
            request.end_time,
            output_path
        )

        # Upload cropped version
        storage = StorageService()
        new_audio_url = storage.upload_cropped_audio(
            output_path,
            request.job_id,
            version=2  # Could increment based on existing versions
        )

        # Calculate new duration
        new_duration = request.end_time - request.start_time

        return CropResponse(audio_url=new_audio_url, duration=new_duration)

    finally:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
