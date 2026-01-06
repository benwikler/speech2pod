import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  waveformData?: number[];
  duration: number;
  cropStart: number;
  cropEnd: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayer({
  audioUrl,
  waveformData = [],
  duration,
  cropStart,
  cropEnd,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);
    const handleCanPlay = () => setIsLoaded(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Spacebar to toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle spacebar if not typing in an input
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        togglePlay();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Generate default waveform if none provided
  const displayWaveform = waveformData.length > 0
    ? waveformData
    : Array(100).fill(0).map(() => 0.3 + Math.random() * 0.4);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={togglePlay}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="text-xs text-gray-400">
            Cropped: {formatTime(cropStart)} - {formatTime(cropEnd)}
          </div>
        </div>

        <button
          onClick={toggleMute}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Waveform Visualization */}
      <div
        className="relative h-20 bg-gray-50 rounded-lg cursor-pointer overflow-hidden"
        onClick={handleWaveformClick}
      >
        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center justify-center gap-[2px] px-2">
          {displayWaveform.map((amplitude, index) => {
            const position = index / displayWaveform.length;
            const isInCropRegion = position >= cropStart / duration && position <= cropEnd / duration;
            const isPlayed = position <= currentTime / duration;

            return (
              <div
                key={index}
                className="flex-1 rounded-full transition-colors"
                style={{
                  height: `${Math.max(4, amplitude * 100)}%`,
                  backgroundColor: isPlayed
                    ? '#8B5CF6'
                    : isInCropRegion
                      ? '#d1d5db'
                      : '#e5e7eb',
                  opacity: isInCropRegion ? 1 : 0.4,
                }}
              />
            );
          })}
        </div>

        {/* Playhead */}
        {duration > 0 && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-pink-500 z-10"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        )}

        {/* Crop region overlay - start */}
        {cropStart > 0 && duration > 0 && (
          <div
            className="absolute top-0 bottom-0 left-0 bg-gray-900/10 pointer-events-none"
            style={{ width: `${(cropStart / duration) * 100}%` }}
          />
        )}

        {/* Crop region overlay - end */}
        {cropEnd < duration && duration > 0 && (
          <div
            className="absolute top-0 bottom-0 right-0 bg-gray-900/10 pointer-events-none"
            style={{ width: `${((duration - cropEnd) / duration) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}
