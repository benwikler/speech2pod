import { useState } from 'react';
import { Youtube, ArrowRight } from 'lucide-react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const isValidYoutubeUrl = (url: string) => {
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/.test(url);
  };

  const isValid = url.trim() && isValidYoutubeUrl(url);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 mb-4">
          <Youtube className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Convert a Speech</h2>
        <p className="text-gray-500 mt-2">
          Paste a YouTube URL to convert a speech into a podcast episode
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="youtube-url" className="sr-only">
            YouTube URL
          </label>
          <input
            id="youtube-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full px-4 py-4 text-lg border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 text-lg font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {isLoading ? (
            'Analyzing...'
          ) : (
            <>
              Analyze Video
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <p className="text-sm text-gray-400 text-center">
          Works best with speeches, press conferences, and public addresses.
          <br />
          The AI will extract speaker info, date, venue, and generate a summary.
        </p>
      </div>
    </div>
  );
}
