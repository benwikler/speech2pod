import anthropic
from dataclasses import dataclass
from typing import Optional
import json
import re

from app.config import get_settings


@dataclass
class GeneratedMetadata:
    speaker: str
    date: str
    venue: str
    topic: str
    summary: str
    suggested_title: str


class AIService:
    """Service for AI-powered metadata generation using Claude."""

    def __init__(self):
        settings = get_settings()
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    def generate_metadata(
        self,
        title: str,
        description: str,
        uploader: str,
        upload_date: str,
        youtube_url: str = "",
        transcript: Optional[str] = None
    ) -> GeneratedMetadata:
        """
        Analyze video metadata and generate structured podcast metadata.
        """
        prompt = f"""Analyze this YouTube video and generate structured metadata for a podcast episode.
The video is a political speech, public address, or similar.

VIDEO TITLE: {title}

VIDEO DESCRIPTION:
{description[:3000] if description else 'No description available'}

YOUTUBE CHANNEL: {uploader}
UPLOAD DATE: {upload_date}
VIDEO URL: {youtube_url}

{f'TRANSCRIPT (partial): {transcript[:2000]}' if transcript else ''}

IMPORTANT INSTRUCTIONS:
- The SPEAKER is the person actually giving the speech, NOT the YouTube channel that uploaded it
- The VENUE should be inferred from context clues in the title/description (e.g., "City Hall", "Capitol Building", "Campaign rally in Des Moines")
- The DATE should be the date of the actual speech/event, not the upload date (infer from context if possible)
- The SUMMARY should be YOUR original writing, not copied from the description
- The TITLE should follow the format: "NAME OCCASION, DATE" (e.g., "Zohran Mamdani inaugural address, 1/1/26")

Respond with a JSON object containing:
1. "speaker": Full name of the person giving the speech (NOT the YouTube channel)
2. "date": Date of the speech formatted as "Month D, YYYY" (e.g., "January 1, 2026")
3. "venue": Specific location where speech was given (e.g., "New York City Hall", "White House Rose Garden")
4. "topic": Brief topic (2-5 words, e.g., "Inaugural Address", "State of the Union", "Economic Policy")
5. "summary": 2-3 sentences YOU write describing what the speech is about and its significance. End with two line breaks then "Source: [channel name], [youtube_url]"
6. "suggested_title": Format as "SPEAKER_NAME OCCASION, M/D/YY" (e.g., "Zohran Mamdani inaugural address, 1/1/26")

Respond ONLY with valid JSON, no other text."""

        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        response_text = message.content[0].text

        # Parse JSON from response
        try:
            # Clean up response - find JSON object
            response_text = response_text.strip()
            # Find the first { and last }
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                json_str = response_text[start:end+1]
                data = json.loads(json_str)
            else:
                data = json.loads(response_text)
        except (json.JSONDecodeError, Exception) as e:
            print(f"AI JSON parse error: {e}")
            print(f"Response was: {response_text[:500]}")
            # Fallback to defaults if parsing fails
            data = {
                "speaker": uploader or "Unknown Speaker",
                "date": self._format_date(upload_date),
                "venue": "Unknown Venue",
                "topic": "Speech",
                "summary": f"A speech by {uploader or 'Unknown Speaker'}.",
                "suggested_title": f"{uploader or 'Unknown Speaker'} - {self._format_date(upload_date)}"
            }

        return GeneratedMetadata(
            speaker=data.get("speaker", "Unknown Speaker"),
            date=data.get("date", self._format_date(upload_date)),
            venue=data.get("venue", "Unknown Venue"),
            topic=data.get("topic", "Speech"),
            summary=data.get("summary", ""),
            suggested_title=data.get("suggested_title", title),
        )

    def generate_intro_script(
        self,
        speaker: str,
        date: str,
        venue: str,
        topic: str
    ) -> str:
        """
        Generate a script for AI voice intro.
        For future extensibility with ElevenLabs/OpenAI TTS.
        """
        prompt = f"""Write a brief, professional podcast intro script (2-3 sentences) for this speech:

Speaker: {speaker}
Date: {date}
Venue: {venue}
Topic: {topic}

The intro should sound like a podcast host introducing the episode. Keep it concise and informative.
Respond with ONLY the script text, no quotation marks or other formatting."""

        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=256,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        return message.content[0].text.strip()

    def generate_outro_script(self, speaker: str, topic: str) -> str:
        """
        Generate a script for AI voice outro.
        For future extensibility with ElevenLabs/OpenAI TTS.
        """
        prompt = f"""Write a brief podcast outro script (1-2 sentences) for a speech by {speaker} about {topic}.

Keep it simple, something like thanking listeners and mentioning the source.
Respond with ONLY the script text, no quotation marks or other formatting."""

        message = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=128,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        return message.content[0].text.strip()

    @staticmethod
    def _format_date(yyyymmdd: str) -> str:
        """Convert YYYYMMDD to readable format."""
        if not yyyymmdd or len(yyyymmdd) != 8:
            return "Unknown Date"
        try:
            from datetime import datetime
            dt = datetime.strptime(yyyymmdd, "%Y%m%d")
            return dt.strftime("%B %d, %Y")
        except ValueError:
            return yyyymmdd
