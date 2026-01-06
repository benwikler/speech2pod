import { User, Calendar, MapPin, Tag, FileText, Heading } from 'lucide-react';

interface MetadataFormProps {
  metadata: {
    title: string;
    speaker: string;
    date: string;
    venue: string;
    topic: string;
    summary: string;
  };
  onChange: (field: string, value: string) => void;
}

export function MetadataForm({ metadata, onChange }: MetadataFormProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Episode Details</h3>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <Heading className="w-4 h-4" />
            Episode Title
          </label>
          <input
            type="text"
            value={metadata.title}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Speaker - Date - Venue"
          />
        </div>

        {/* Speaker & Date Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4" />
              Speaker
            </label>
            <input
              type="text"
              value={metadata.speaker}
              onChange={(e) => onChange('speaker', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Speaker name"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <input
              type="text"
              value={metadata.date}
              onChange={(e) => onChange('date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="January 1, 2024"
            />
          </div>
        </div>

        {/* Venue & Topic Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4" />
              Venue
            </label>
            <input
              type="text"
              value={metadata.venue}
              onChange={(e) => onChange('venue', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Location or event"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Tag className="w-4 h-4" />
              Topic
            </label>
            <input
              type="text"
              value={metadata.topic}
              onChange={(e) => onChange('topic', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Main topic"
            />
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
            <FileText className="w-4 h-4" />
            Summary
          </label>
          <textarea
            value={metadata.summary}
            onChange={(e) => onChange('summary', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Brief description of the speech content..."
          />
        </div>
      </div>
    </div>
  );
}
