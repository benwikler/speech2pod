import boto3
from botocore.config import Config
import os
import mimetypes
from typing import Optional

from app.config import get_settings


class StorageService:
    """Service for S3-compatible storage (Cloudflare R2)."""

    def __init__(self):
        settings = get_settings()

        # Configure S3 client for Cloudflare R2
        self.client = boto3.client(
            's3',
            endpoint_url=f'https://{settings.r2_account_id}.r2.cloudflarestorage.com',
            aws_access_key_id=settings.r2_access_key_id,
            aws_secret_access_key=settings.r2_secret_access_key,
            config=Config(
                signature_version='s3v4',
                s3={'addressing_style': 'path'}
            )
        )

        self.bucket_name = settings.r2_bucket_name
        self.public_url = settings.r2_public_url.rstrip('/')

    def upload_file(
        self,
        local_path: str,
        remote_key: str,
        content_type: Optional[str] = None
    ) -> str:
        """
        Upload a file to R2 storage.
        Returns the public URL for the file.
        """
        if content_type is None:
            content_type, _ = mimetypes.guess_type(local_path)
            content_type = content_type or 'application/octet-stream'

        with open(local_path, 'rb') as f:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=remote_key,
                Body=f,
                ContentType=content_type
            )

        return f"{self.public_url}/{remote_key}"

    def upload_audio(self, local_path: str, episode_id: str) -> str:
        """Upload audio file and return public URL."""
        remote_key = f"audio/{episode_id}.mp3"
        return self.upload_file(local_path, remote_key, 'audio/mpeg')

    def upload_thumbnail(self, local_path: str, episode_id: str) -> str:
        """Upload thumbnail and return public URL."""
        remote_key = f"thumbnails/{episode_id}.jpg"
        return self.upload_file(local_path, remote_key, 'image/jpeg')

    def upload_cropped_audio(
        self,
        local_path: str,
        episode_id: str,
        version: int = 1
    ) -> str:
        """Upload cropped audio version."""
        remote_key = f"audio/{episode_id}_v{version}.mp3"
        return self.upload_file(local_path, remote_key, 'audio/mpeg')

    def delete_file(self, remote_key: str) -> bool:
        """Delete a file from storage."""
        try:
            self.client.delete_object(
                Bucket=self.bucket_name,
                Key=remote_key
            )
            return True
        except Exception:
            return False

    def file_exists(self, remote_key: str) -> bool:
        """Check if a file exists in storage."""
        try:
            self.client.head_object(
                Bucket=self.bucket_name,
                Key=remote_key
            )
            return True
        except Exception:
            return False

    def get_public_url(self, remote_key: str) -> str:
        """Get the public URL for a file."""
        return f"{self.public_url}/{remote_key}"
