import { X, RefreshCw, Save, Upload } from 'lucide-react';

interface ActionButtonsProps {
  onCancel: () => void;
  onRegenerate: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isLoading: boolean;
}

export function ActionButtons({
  onCancel,
  onRegenerate,
  onSaveDraft,
  onPublish,
  isLoading,
}: ActionButtonsProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Cancel & Regenerate */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            onClick={onRegenerate}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        </div>

        {/* Right side - Save & Publish */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSaveDraft}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 text-purple-700 bg-purple-100 rounded-xl hover:bg-purple-200 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={onPublish}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors font-medium shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Publish
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
