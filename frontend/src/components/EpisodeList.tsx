import { useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Upload,
  Archive,
  ExternalLink,
  Clock,
} from 'lucide-react';
import {
  useEpisodes,
  useDeleteEpisode,
  usePublishEpisode,
  useUnpublishEpisode,
} from '../hooks/useApi';
import type { Episode } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface EpisodeListProps {
  onBack: () => void;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} min`;
}

export function EpisodeList({ onBack }: EpisodeListProps) {
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  const { data: episodes, isLoading } = useEpisodes(
    filter === 'all' ? undefined : filter
  );
  const deleteMutation = useDeleteEpisode();
  const publishMutation = usePublishEpisode();
  const unpublishMutation = useUnpublishEpisode();

  const handlePlay = (episode: Episode) => {
    if (playingId === episode.id) {
      audioRef?.pause();
      setPlayingId(null);
    } else {
      if (audioRef) {
        audioRef.pause();
      }
      const audio = new Audio(episode.audio_url);
      audio.play();
      audio.onended = () => setPlayingId(null);
      setAudioRef(audio);
      setPlayingId(episode.id);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this episode?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handlePublish = async (id: number) => {
    await publishMutation.mutateAsync(id);
  };

  const handleUnpublish = async (id: number) => {
    await unpublishMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">New Episode</span>
        </button>

        {/* Filter Tabs */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          {(['all', 'published', 'draft'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading episodes...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && episodes?.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Archive className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No episodes yet</h3>
          <p className="text-gray-500 mt-1">
            Create your first episode by converting a YouTube video.
          </p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2.5 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors font-medium"
          >
            Create Episode
          </button>
        </div>
      )}

      {/* Episode Cards */}
      <div className="space-y-4">
        {episodes?.map((episode) => (
          <EpisodeCard
            key={episode.id}
            episode={episode}
            isPlaying={playingId === episode.id}
            onPlay={() => handlePlay(episode)}
            onDelete={() => handleDelete(episode.id)}
            onPublish={() => handlePublish(episode.id)}
            onUnpublish={() => handleUnpublish(episode.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface EpisodeCardProps {
  episode: Episode;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
}

function EpisodeCard({
  episode,
  isPlaying,
  onPlay,
  onDelete,
  onPublish,
  onUnpublish,
}: EpisodeCardProps) {
  const isPublished = episode.status === 'published';

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="flex">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0">
          <img
            src={episode.thumbnail_url}
            alt={episode.title}
            className="w-32 h-32 object-cover"
          />
          <button
            onClick={onPlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white ml-1" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 truncate">
                  {episode.title}
                </h3>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    isPublished
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {episode.speaker} &middot; {episode.speech_date}
              </p>
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                {episode.summary}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDuration(episode.audio_duration)}
              </span>
              {episode.youtube_url && (
                <a
                  href={episode.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-purple-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Source
                </a>
              )}
              <span className="text-gray-400">
                {format(new Date(episode.created_at), 'MMM d, yyyy')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isPublished ? (
                <button
                  onClick={onUnpublish}
                  className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                  title="Move to drafts"
                >
                  <Archive className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onPublish}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Publish"
                >
                  <Upload className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onDelete}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
