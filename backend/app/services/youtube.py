import yt_dlp
import tempfile
import os
import re
from typing import Optional
from dataclasses import dataclass


@dataclass
class YouTubeMetadata:
    video_id: str
    title: str
    description: str
    thumbnail_url: str
    duration: int  # seconds
    upload_date: str
    uploader: str
    view_count: int


class YouTubeService:
    """Service for extracting metadata and audio from YouTube videos."""

    @staticmethod
    def extract_video_id(url: str) -> Optional[str]:
        """Extract YouTube video ID from various URL formats."""
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
            r'(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})',
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    @staticmethod
    def get_metadata(url: str) -> YouTubeMetadata:
        """Fetch video metadata without downloading."""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        # Get the best thumbnail
        thumbnails = info.get('thumbnails', [])
        thumbnail_url = ""
        if thumbnails:
            # Sort by preference: maxresdefault > hqdefault > default
            for thumb in reversed(thumbnails):
                if thumb.get('url'):
                    thumbnail_url = thumb['url']
                    break

        return YouTubeMetadata(
            video_id=info.get('id', ''),
            title=info.get('title', ''),
            description=info.get('description', ''),
            thumbnail_url=thumbnail_url,
            duration=info.get('duration', 0),
            upload_date=info.get('upload_date', ''),
            uploader=info.get('uploader', ''),
            view_count=info.get('view_count', 0),
        )

    @staticmethod
    def download_audio(url: str, output_dir: str = None) -> tuple[str, str]:
        """
        Download audio from YouTube video.
        Returns tuple of (audio_path, thumbnail_path)
        """
        if output_dir is None:
            output_dir = tempfile.mkdtemp()

        video_id = YouTubeService.extract_video_id(url)
        audio_path = os.path.join(output_dir, f"{video_id}.mp3")
        thumbnail_path = os.path.join(output_dir, f"{video_id}.jpg")

        ydl_opts = {
            'format': 'worstaudio/worst',  # Start with worst quality to get any working stream
            'outtmpl': os.path.join(output_dir, f'{video_id}.%(ext)s'),
            'postprocessors': [
                {
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                },
            ],
            'writethumbnail': True,
            'quiet': False,
            'no_warnings': False,
            # Use android client which often works without PO token
            'extractor_args': {
                'youtube': {
                    'player_client': ['android', 'web_embedded'],
                }
            },
            'socket_timeout': 60,
            'retries': 10,
            'fragment_retries': 10,
            'nocheckcertificate': True,
            'http_headers': {
                'User-Agent': 'com.google.android.youtube/19.02.39 (Linux; U; Android 14) gzip',
            },
            'ffmpeg_location': '/opt/homebrew/bin/',
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

        # Find the actual thumbnail file (could be .jpg, .webp, etc.)
        actual_thumbnail = None
        for ext in ['.jpg', '.webp', '.png']:
            possible_path = os.path.join(output_dir, f"{video_id}{ext}")
            if os.path.exists(possible_path):
                actual_thumbnail = possible_path
                break

        # Convert thumbnail to jpg if needed
        if actual_thumbnail and actual_thumbnail != thumbnail_path:
            import subprocess
            subprocess.run([
                '/opt/homebrew/bin/ffmpeg', '-y', '-i', actual_thumbnail,
                '-vf', 'scale=1400:1400:force_original_aspect_ratio=decrease',
                thumbnail_path
            ], capture_output=True)
            if os.path.exists(actual_thumbnail) and actual_thumbnail != thumbnail_path:
                os.remove(actual_thumbnail)

        return audio_path, thumbnail_path

    @staticmethod
    def get_transcript(url: str) -> Optional[str]:
        """
        Attempt to get video transcript/captions.
        Returns transcript text or None if unavailable.
        """
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'skip_download': True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

            # Check for manual or auto-generated captions
            subtitles = info.get('subtitles', {})
            auto_captions = info.get('automatic_captions', {})

            # Prefer manual captions over auto-generated
            captions = subtitles.get('en') or auto_captions.get('en')

            if captions:
                # Get the caption URL (prefer json3 or vtt format)
                for cap in captions:
                    if cap.get('ext') in ['json3', 'vtt', 'srv1']:
                        # Would need to fetch and parse the caption file
                        # For now, return None and rely on title/description
                        return None

        except Exception:
            pass

        return None
