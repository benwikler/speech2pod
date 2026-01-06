import { useState, useEffect, useRef } from 'react';
import { Scissors, SkipBack, SkipForward } from 'lucide-react';

interface CropControlsProps {
  duration: number;
  cropStart: number;
  cropEnd: number;
  onChange: (start: number, end: number) => void;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export function CropControls({
  duration,
  cropStart,
  cropEnd,
  onChange,
}: CropControlsProps) {
  const [startInput, setStartInput] = useState(formatTime(cropStart));
  const [endInput, setEndInput] = useState(formatTime(cropEnd));
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStartInput(formatTime(cropStart));
  }, [cropStart]);

  useEffect(() => {
    setEndInput(formatTime(cropEnd));
  }, [cropEnd]);

  const handleStartChange = (value: string) => {
    setStartInput(value);
    const parsed = parseTime(value);
    if (!isNaN(parsed) && parsed >= 0 && parsed < cropEnd) {
      onChange(parsed, cropEnd);
    }
  };

  const handleEndChange = (value: string) => {
    setEndInput(value);
    const parsed = parseTime(value);
    if (!isNaN(parsed) && parsed > cropStart && parsed <= duration) {
      onChange(cropStart, parsed);
    }
  };

  const nudge = (type: 'start' | 'end', direction: number) => {
    const amount = 5; // 5 seconds
    if (type === 'start') {
      const newStart = Math.max(0, Math.min(cropEnd - 1, cropStart + direction * amount));
      onChange(newStart, cropEnd);
    } else {
      const newEnd = Math.max(cropStart + 1, Math.min(duration, cropEnd + direction * amount));
      onChange(cropStart, newEnd);
    }
  };

  const getPositionFromEvent = (clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  };

  const handleMouseDown = (handle: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(handle);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const position = getPositionFromEvent(e.clientX);

      if (dragging === 'start') {
        const newStart = Math.max(0, Math.min(cropEnd - 1, position));
        onChange(newStart, cropEnd);
      } else {
        const newEnd = Math.max(cropStart + 1, Math.min(duration, position));
        onChange(cropStart, newEnd);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, cropStart, cropEnd, duration, onChange]);

  const croppedDuration = cropEnd - cropStart;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Scissors className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-900">Crop Audio</h3>
        <span className="ml-auto text-sm text-gray-500">
          Final duration: {formatTime(croppedDuration)}
        </span>
      </div>

      {/* Visual Range Slider */}
      <div className="mb-6">
        <div
          ref={trackRef}
          className="relative h-8 bg-gray-100 rounded-lg select-none"
        >
          {/* Selected range */}
          <div
            className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"
            style={{
              left: `${(cropStart / duration) * 100}%`,
              width: `${((cropEnd - cropStart) / duration) * 100}%`,
            }}
          />

          {/* Start handle */}
          <div
            onMouseDown={handleMouseDown('start')}
            className="absolute w-4 h-8 bg-purple-600 rounded-l-lg cursor-ew-resize hover:bg-purple-700 transition-colors z-10 flex items-center justify-center"
            style={{ left: `calc(${(cropStart / duration) * 100}% - 2px)` }}
          >
            <div className="w-0.5 h-4 bg-white/50 rounded-full" />
          </div>

          {/* End handle */}
          <div
            onMouseDown={handleMouseDown('end')}
            className="absolute w-4 h-8 bg-pink-600 rounded-r-lg cursor-ew-resize hover:bg-pink-700 transition-colors z-10 flex items-center justify-center"
            style={{ left: `calc(${(cropEnd / duration) * 100}% - 14px)` }}
          >
            <div className="w-0.5 h-4 bg-white/50 rounded-full" />
          </div>
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>0:00</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Precise Input Controls */}
      <div className="grid grid-cols-2 gap-6">
        {/* Start Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Time
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => nudge('start', -1)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back 5 seconds"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={startInput}
              onChange={(e) => handleStartChange(e.target.value)}
              className="flex-1 px-3 py-2 text-center border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
              placeholder="0:00"
            />
            <button
              onClick={() => nudge('start', 1)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Forward 5 seconds"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* End Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Time
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => nudge('end', -1)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back 5 seconds"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={endInput}
              onChange={(e) => handleEndChange(e.target.value)}
              className="flex-1 px-3 py-2 text-center border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
              placeholder="0:00"
            />
            <button
              onClick={() => nudge('end', 1)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Forward 5 seconds"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Drag the handles or enter times manually. Format: mm:ss or h:mm:ss
      </p>
    </div>
  );
}
