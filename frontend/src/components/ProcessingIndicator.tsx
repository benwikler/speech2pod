interface ProcessingIndicatorProps {
  status?: string;
}

export function ProcessingIndicator({ status }: ProcessingIndicatorProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Spinning ring with static icon */}
      <div className="flex justify-center mb-6">
        <div className="relative w-24 h-24">
          {/* Background circle */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-50 to-pink-50"></div>
          {/* Spinning ring */}
          <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500 animate-spin" style={{ animationDuration: '1.5s' }}></div>
          {/* Static icon in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">🎙️</span>
          </div>
        </div>
      </div>

      {/* Static message */}
      <div className="text-center">
        <p className="text-lg font-semibold text-gray-800">
          Processing audio...
        </p>
        <p className="text-sm text-gray-400 mt-1">
          This may take a minute or two
        </p>
      </div>
    </div>
  );
}
