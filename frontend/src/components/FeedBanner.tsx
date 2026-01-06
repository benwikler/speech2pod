import { useState } from 'react';
import { Rss, Copy, Check, ExternalLink } from 'lucide-react';
import { useFeedInfo } from '../hooks/useApi';

export function FeedBanner() {
  const { data: feedInfo } = useFeedInfo();
  const [copied, setCopied] = useState(false);

  if (!feedInfo?.feed_url) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(feedInfo.feed_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 mb-6 text-white">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Rss className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">{feedInfo.title}</h3>
            <p className="text-sm text-purple-100">
              {feedInfo.published_episodes} published &middot;{' '}
              {feedInfo.draft_episodes} drafts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/10 rounded-lg px-3 py-2 text-sm font-mono max-w-xs truncate">
            {feedInfo.feed_url}
          </div>
          <button
            onClick={handleCopy}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="Copy feed URL"
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
          <a
            href={feedInfo.feed_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="Open feed"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>

      <p className="text-xs text-purple-200 mt-3">
        Add this feed URL to your podcast app (Apple Podcasts, Overcast, Pocket Casts, etc.) to subscribe
      </p>
    </div>
  );
}
