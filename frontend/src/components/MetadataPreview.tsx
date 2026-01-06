import { ExternalLink, Clock, Calendar, MapPin, Tag } from 'lucide-react';

interface MetadataPreviewProps {
  thumbnailUrl: string;
  metadata: {
    title: string;
    speaker: string;
    date: string;
    venue: string;
    topic: string;
    summary: string;
  };
  youtubeUrl: string;
  duration: number;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function MetadataPreview({
  thumbnailUrl,
  metadata,
  youtubeUrl,
  duration,
}: MetadataPreviewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Apple Podcasts Style Card */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-6">
        <div className="flex gap-6">
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            <img
              src={thumbnailUrl}
              alt={metadata.title}
              className="w-32 h-32 rounded-2xl object-cover shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-white">
            <p className="text-purple-200 text-sm font-medium uppercase tracking-wide">
              New Episode Preview
            </p>
            <h3 className="text-xl font-bold mt-1 truncate">{metadata.title || 'Untitled Episode'}</h3>
            <p className="text-purple-100 mt-1">Speeches Podcast</p>

            <div className="flex items-center gap-4 mt-4 text-sm text-purple-200">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(duration)}
              </span>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                YouTube
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Details */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
              <p className="text-sm font-medium text-gray-900">{metadata.date || 'Unknown'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Venue</p>
              <p className="text-sm font-medium text-gray-900">{metadata.venue || 'Unknown'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Tag className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Topic</p>
              <p className="text-sm font-medium text-gray-900">{metadata.topic || 'General'}</p>
            </div>
          </div>
        </div>

        {metadata.summary && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Summary</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {metadata.summary.replace(/\s*(Source:)/i, '\n\n$1')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
