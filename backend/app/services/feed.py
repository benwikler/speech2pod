from feedgen.feed import FeedGenerator
from datetime import datetime, timezone
from typing import List

from app.config import get_settings
from app.models.episode import Episode, EpisodeStatus


class FeedService:
    """Service for generating iTunes-compatible RSS podcast feed."""

    def __init__(self):
        self.settings = get_settings()

    def generate_feed(self, episodes: List[Episode]) -> str:
        """Generate RSS feed XML from published episodes."""
        fg = FeedGenerator()
        fg.load_extension('podcast')

        # Basic feed info
        base_url = self.settings.podcast_base_url.rstrip('/')
        fg.id(f"{base_url}/feed.xml")
        fg.title(self.settings.podcast_title)
        fg.description(self.settings.podcast_description)
        fg.link(href=base_url, rel='alternate')
        fg.link(href=f"{base_url}/api/feed.xml", rel='self')
        fg.language('en')

        # Podcast-specific metadata
        fg.podcast.itunes_category('News', 'Politics')
        fg.podcast.itunes_author(self.settings.podcast_author)
        fg.podcast.itunes_owner(
            name=self.settings.podcast_author,
            email=self.settings.podcast_email
        )
        fg.podcast.itunes_explicit('no')
        fg.podcast.itunes_type('episodic')

        # Podcast image
        if self.settings.podcast_image_url:
            fg.image(self.settings.podcast_image_url)
            fg.podcast.itunes_image(self.settings.podcast_image_url)

        # Add episodes (only published ones)
        published_episodes = [
            ep for ep in episodes
            if ep.status == EpisodeStatus.PUBLISHED
        ]

        for episode in published_episodes:
            self._add_episode(fg, episode)

        return fg.rss_str(pretty=True).decode('utf-8')

    def _add_episode(self, fg: FeedGenerator, episode: Episode) -> None:
        """Add a single episode to the feed."""
        fe = fg.add_entry()

        # Basic episode info
        fe.id(str(episode.id))
        fe.title(episode.title)

        # Build description with metadata
        description_parts = []
        if episode.speaker:
            description_parts.append(f"Speaker: {episode.speaker}")
        if episode.speech_date:
            description_parts.append(f"Date: {episode.speech_date}")
        if episode.venue:
            description_parts.append(f"Venue: {episode.venue}")
        if episode.topic:
            description_parts.append(f"Topic: {episode.topic}")
        if episode.summary:
            description_parts.append(f"\n{episode.summary}")
        if episode.youtube_url:
            description_parts.append(f"\nSource: {episode.youtube_url}")

        description = "\n".join(description_parts)
        fe.description(description)
        fe.content(description, type='text')

        # Link to YouTube source
        if episode.youtube_url:
            fe.link(href=episode.youtube_url)

        # Publication date - ensure timezone info is present
        pub_date = episode.published_at or episode.created_at or datetime.now(timezone.utc)
        if pub_date.tzinfo is None:
            pub_date = pub_date.replace(tzinfo=timezone.utc)
        fe.pubDate(pub_date)

        # Audio enclosure
        if episode.audio_url:
            # Calculate file size estimate (bitrate * duration / 8)
            duration_sec = episode.audio_duration or 0
            # 192kbps = 24000 bytes/sec
            file_size = int(duration_sec * 24000) if duration_sec else 0

            fe.enclosure(
                url=episode.audio_url,
                length=str(file_size),
                type='audio/mpeg'
            )

        # iTunes-specific
        fe.podcast.itunes_author(episode.speaker or self.settings.podcast_author)

        if episode.summary:
            fe.podcast.itunes_summary(episode.summary)

        if episode.audio_duration:
            # Format duration as HH:MM:SS
            duration_sec = int(episode.audio_duration)
            hours = duration_sec // 3600
            minutes = (duration_sec % 3600) // 60
            seconds = duration_sec % 60
            if hours > 0:
                duration_str = f"{hours}:{minutes:02d}:{seconds:02d}"
            else:
                duration_str = f"{minutes}:{seconds:02d}"
            fe.podcast.itunes_duration(duration_str)

        # Episode artwork
        if episode.thumbnail_url:
            fe.podcast.itunes_image(episode.thumbnail_url)

        fe.podcast.itunes_explicit('no')
