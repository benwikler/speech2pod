import subprocess
import tempfile
import os
import json
from typing import Optional, List
from dataclasses import dataclass

from app.config import get_settings

# FFmpeg binary paths (homebrew on macOS)
FFMPEG = '/opt/homebrew/bin/ffmpeg'
FFPROBE = '/opt/homebrew/bin/ffprobe'


@dataclass
class AudioProcessingResult:
    output_path: str
    duration: float
    waveform: List[float]
    silence_start: float
    silence_end: float


class AudioService:
    """Service for audio processing using FFmpeg."""

    def __init__(self):
        self.settings = get_settings()

    def process_audio(
        self,
        input_path: str,
        output_path: Optional[str] = None,
        normalize: bool = True,
        trim_silence: bool = True,
    ) -> AudioProcessingResult:
        """
        Process audio file: normalize loudness and optionally trim silence.
        Returns processed audio path and metadata.
        """
        if output_path is None:
            fd, output_path = tempfile.mkstemp(suffix='.mp3')
            os.close(fd)

        # Get initial duration and detect silence
        duration = self._get_duration(input_path)
        silence_start, silence_end = 0.0, 0.0

        if trim_silence:
            silence_start, silence_end = self._detect_silence(input_path, duration)

        # Build FFmpeg filter chain
        filters = []

        # Trim silence from start and end
        if trim_silence and (silence_start > 0.5 or silence_end > 0.5):
            trim_end = duration - silence_end
            filters.append(f"atrim=start={silence_start}:end={trim_end}")
            filters.append("asetpts=PTS-STARTPTS")

        # Normalize loudness (EBU R128)
        if normalize:
            target_lufs = self.settings.loudness_target
            filters.append(f"loudnorm=I={target_lufs}:TP=-1.5:LRA=11")

        # Build FFmpeg command
        filter_str = ",".join(filters) if filters else "anull"

        cmd = [
            FFMPEG, '-y',
            '-i', input_path,
            '-af', filter_str,
            '-ar', str(self.settings.audio_sample_rate),
            '-ab', self.settings.audio_bitrate,
            '-ac', '2',  # Stereo
            output_path
        ]

        subprocess.run(cmd, capture_output=True, check=True)

        # Get final duration and generate waveform
        final_duration = self._get_duration(output_path)
        waveform = self._generate_waveform(output_path)

        return AudioProcessingResult(
            output_path=output_path,
            duration=final_duration,
            waveform=waveform,
            silence_start=silence_start,
            silence_end=silence_end,
        )

    def crop_audio(
        self,
        input_path: str,
        start_time: float,
        end_time: float,
        output_path: Optional[str] = None,
    ) -> str:
        """Crop audio to specified start and end times."""
        if output_path is None:
            fd, output_path = tempfile.mkstemp(suffix='.mp3')
            os.close(fd)

        cmd = [
            FFMPEG, '-y',
            '-i', input_path,
            '-ss', str(start_time),
            '-to', str(end_time),
            '-c:a', 'libmp3lame',
            '-ab', self.settings.audio_bitrate,
            output_path
        ]

        subprocess.run(cmd, capture_output=True, check=True)
        return output_path

    def concatenate_audio(
        self,
        audio_files: List[str],
        output_path: Optional[str] = None,
    ) -> str:
        """
        Concatenate multiple audio files (for intro/outro support).
        """
        if output_path is None:
            fd, output_path = tempfile.mkstemp(suffix='.mp3')
            os.close(fd)

        # Create concat file list
        fd, list_path = tempfile.mkstemp(suffix='.txt')
        with os.fdopen(fd, 'w') as f:
            for audio_file in audio_files:
                # Escape single quotes in path
                escaped_path = audio_file.replace("'", "'\\''")
                f.write(f"file '{escaped_path}'\n")

        cmd = [
            FFMPEG, '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', list_path,
            '-c:a', 'libmp3lame',
            '-ab', self.settings.audio_bitrate,
            output_path
        ]

        try:
            subprocess.run(cmd, capture_output=True, check=True)
        finally:
            os.unlink(list_path)

        return output_path

    def _get_duration(self, audio_path: str) -> float:
        """Get audio duration in seconds."""
        cmd = [
            FFPROBE,
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'json',
            audio_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        data = json.loads(result.stdout)
        return float(data['format']['duration'])

    def _detect_silence(
        self,
        audio_path: str,
        duration: float,
        threshold: str = '-40dB',
        min_duration: float = 0.5
    ) -> tuple[float, float]:
        """
        Detect silence at the start and end of audio.
        Returns (start_silence_duration, end_silence_duration).
        """
        cmd = [
            FFMPEG,
            '-i', audio_path,
            '-af', f'silencedetect=noise={threshold}:d={min_duration}',
            '-f', 'null',
            '-'
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        output = result.stderr

        # Parse silence detection output
        silence_start = 0.0
        silence_end = 0.0

        # Look for silence at the very beginning
        import re
        start_matches = re.findall(r'silence_start: ([\d.]+)', output)
        end_matches = re.findall(r'silence_end: ([\d.]+)', output)

        if start_matches and end_matches:
            # Check if first silence starts at 0
            first_start = float(start_matches[0])
            if first_start < 0.1:  # Essentially at the beginning
                silence_start = float(end_matches[0])

            # Check for silence at the end
            if len(start_matches) > 0:
                last_start = float(start_matches[-1])
                # If the last silence starts close to the end
                if last_start > duration - 30:  # Within last 30 seconds
                    silence_end = duration - last_start

        return silence_start, silence_end

    def _generate_waveform(self, audio_path: str, samples: int = 200) -> List[float]:
        """
        Generate waveform data for visualization.
        Returns list of amplitude values (0-1).
        """
        # Use FFmpeg to extract raw audio and compute RMS per segment
        cmd = [
            FFMPEG,
            '-i', audio_path,
            '-ac', '1',
            '-ar', '8000',
            '-f', 'f32le',
            '-'
        ]

        result = subprocess.run(cmd, capture_output=True)
        raw_audio = result.stdout

        import struct
        import numpy as np

        # Convert to float array
        num_samples = len(raw_audio) // 4
        audio_data = struct.unpack(f'{num_samples}f', raw_audio)
        audio_array = np.array(audio_data)

        # Split into segments and compute RMS
        segment_size = max(1, len(audio_array) // samples)
        waveform = []

        for i in range(samples):
            start = i * segment_size
            end = min(start + segment_size, len(audio_array))
            segment = audio_array[start:end]

            if len(segment) > 0:
                rms = np.sqrt(np.mean(segment ** 2))
                # Normalize to 0-1 range (with some headroom)
                normalized = min(1.0, rms * 3)
                waveform.append(float(normalized))
            else:
                waveform.append(0.0)

        return waveform
