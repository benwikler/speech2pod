import { useState, useEffect } from 'react';
import { UrlInput } from './components/UrlInput';
import { MetadataPreview } from './components/MetadataPreview';
import { MetadataForm } from './components/MetadataForm';
import { AudioPlayer } from './components/AudioPlayer';
import { CropControls } from './components/CropControls';
import { ActionButtons } from './components/ActionButtons';
import { EpisodeList } from './components/EpisodeList';
import { FeedBanner } from './components/FeedBanner';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ProcessingIndicator } from './components/ProcessingIndicator';
import {
  useAnalyzeVideo,
  useStartExtraction,
  useJobStatus,
  useCreateEpisode,
  useCropAudio
} from './hooks/useApi';
import type { AppState } from './types';
import { Podcast, ListMusic } from 'lucide-react';

const initialState: AppState = {
  step: 'input',
  youtubeUrl: '',
  analyzeData: null,
  jobId: null,
  jobStatus: null,
  metadata: {
    title: '',
    speaker: '',
    date: '',
    venue: '',
    topic: '',
    summary: '',
  },
  cropStart: 0,
  cropEnd: 0,
  error: null,
};

export default function App() {
  const [state, setState] = useState<AppState>(initialState);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  const analyzeMutation = useAnalyzeVideo();
  const extractMutation = useStartExtraction();
  const createEpisodeMutation = useCreateEpisode();
  const cropMutation = useCropAudio();

  const { data: jobData } = useJobStatus(
    state.jobId,
    state.step === 'extracting'
  );

  // Update state when job completes
  useEffect(() => {
    if (
      jobData &&
      state.step === 'extracting' &&
      jobData.status === 'completed'
    ) {
      setState((s) => ({
        ...s,
        step: 'editing',
        jobStatus: jobData,
        cropStart: jobData.detected_silence?.start_trim || 0,
        cropEnd: jobData.duration || 0,
      }));
      setCurrentAudioUrl(jobData.audio_url || null);
    }
  }, [jobData, state.step]);

  const handleAnalyze = async (url: string) => {
    setState((s) => ({ ...s, youtubeUrl: url, step: 'analyzing', error: null }));
    try {
      const data = await analyzeMutation.mutateAsync(url);
      setState((s) => ({
        ...s,
        step: 'preview',
        analyzeData: data,
        metadata: {
          title: data.generated_metadata.suggested_title,
          speaker: data.generated_metadata.speaker,
          date: data.generated_metadata.date,
          venue: data.generated_metadata.venue,
          topic: data.generated_metadata.topic,
          summary: data.generated_metadata.summary,
        },
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        step: 'input',
        error: err instanceof Error ? err.message : 'Failed to analyze video',
      }));
    }
  };

  const handleGenerate = async () => {
    if (!state.analyzeData) return;
    setState((s) => ({ ...s, step: 'extracting', error: null }));
    try {
      const result = await extractMutation.mutateAsync({
        youtube_id: state.analyzeData.youtube_id,
        youtube_url: state.youtubeUrl,
      });
      setState((s) => ({ ...s, jobId: result.job_id }));
    } catch (err) {
      setState((s) => ({
        ...s,
        step: 'preview',
        error: err instanceof Error ? err.message : 'Failed to start extraction',
      }));
    }
  };

  const handleMetadataChange = (field: string, value: string) => {
    setState((s) => ({
      ...s,
      metadata: { ...s.metadata, [field]: value },
    }));
  };

  const handleCropChange = (start: number, end: number) => {
    setState((s) => ({ ...s, cropStart: start, cropEnd: end }));
  };

  const handleSave = async (publish: boolean) => {
    if (!state.analyzeData || !state.jobStatus?.audio_url) return;

    setState((s) => ({ ...s, step: 'saving' }));

    try {
      // If cropped differently from original, create new audio
      let audioUrl = state.jobStatus.audio_url;
      let duration = state.jobStatus.duration || 0;

      const needsCrop =
        state.cropStart > 0 ||
        state.cropEnd < (state.jobStatus.duration || 0);

      if (needsCrop && state.jobId) {
        const cropResult = await cropMutation.mutateAsync({
          jobId: state.jobId,
          startTime: state.cropStart,
          endTime: state.cropEnd,
        });
        audioUrl = cropResult.audio_url;
        duration = cropResult.duration;
      }

      await createEpisodeMutation.mutateAsync({
        youtube_id: state.analyzeData.youtube_id,
        youtube_url: state.youtubeUrl,
        original_title: state.analyzeData.original_title,
        original_description: state.analyzeData.description,
        title: state.metadata.title,
        speaker: state.metadata.speaker,
        speech_date: state.metadata.date,
        venue: state.metadata.venue,
        topic: state.metadata.topic,
        summary: state.metadata.summary,
        audio_url: audioUrl,
        audio_duration: duration,
        thumbnail_url: state.jobStatus.thumbnail_url || state.analyzeData.thumbnail_url,
        crop_start: state.cropStart,
        crop_end: state.cropEnd,
        status: publish ? 'published' : 'draft',
      });

      // Reset to initial state
      setState(initialState);
      setCurrentAudioUrl(null);
      setShowEpisodes(true);
    } catch (err) {
      setState((s) => ({
        ...s,
        step: 'editing',
        error: err instanceof Error ? err.message : 'Failed to save episode',
      }));
    }
  };

  const handleCancel = () => {
    setState(initialState);
    setCurrentAudioUrl(null);
  };

  const handleRegenerate = () => {
    setState((s) => ({ ...s, step: 'preview', jobId: null, jobStatus: null }));
    setCurrentAudioUrl(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => { setState(initialState); setCurrentAudioUrl(null); setShowEpisodes(false); }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Podcast className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-gray-900">Speech2Pod</h1>
              <p className="text-xs text-gray-500">Convert speeches to podcasts</p>
            </div>
          </button>
          <button
            onClick={() => setShowEpisodes(!showEpisodes)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ListMusic className="w-4 h-4" />
            {showEpisodes ? 'New Episode' : 'My Episodes'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Feed Banner */}
        <FeedBanner />

        {showEpisodes ? (
          <EpisodeList onBack={() => setShowEpisodes(false)} />
        ) : (
          <div className="space-y-6">
            {/* Error Banner */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {state.error}
              </div>
            )}

            {/* Step: URL Input */}
            {state.step === 'input' && (
              <UrlInput
                onSubmit={handleAnalyze}
                isLoading={false}
              />
            )}

            {/* Step: Analyzing */}
            {state.step === 'analyzing' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-pink-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
                  </div>
                </div>
                <p className="text-lg font-medium text-gray-700">Analyzing video...</p>
                <p className="text-sm text-gray-400 mt-1">AI is extracting speaker, venue, date & writing summary</p>
                <div className="mt-4 flex justify-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}

            {/* Step: Preview Metadata */}
            {state.step === 'preview' && state.analyzeData && (
              <>
                <MetadataPreview
                  thumbnailUrl={state.analyzeData.thumbnail_url}
                  metadata={state.metadata}
                  youtubeUrl={state.youtubeUrl}
                  duration={state.analyzeData.duration_seconds}
                />
                <MetadataForm
                  metadata={state.metadata}
                  onChange={handleMetadataChange}
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="px-6 py-3 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-colors font-medium shadow-lg"
                  >
                    Generate Audio
                  </button>
                </div>
              </>
            )}

            {/* Step: Extracting */}
            {state.step === 'extracting' && (
              <ProcessingIndicator status={jobData?.status} />
            )}

            {/* Step: Editing */}
            {state.step === 'editing' && state.analyzeData && state.jobStatus && (
              <>
                <MetadataPreview
                  thumbnailUrl={state.jobStatus.thumbnail_url || state.analyzeData.thumbnail_url}
                  metadata={state.metadata}
                  youtubeUrl={state.youtubeUrl}
                  duration={state.cropEnd - state.cropStart}
                />
                <MetadataForm
                  metadata={state.metadata}
                  onChange={handleMetadataChange}
                />
                {currentAudioUrl && (
                  <AudioPlayer
                    audioUrl={currentAudioUrl}
                    waveformData={state.jobStatus.waveform_data}
                    duration={state.jobStatus.duration || 0}
                    cropStart={state.cropStart}
                    cropEnd={state.cropEnd}
                  />
                )}
                <CropControls
                  duration={state.jobStatus.duration || 0}
                  cropStart={state.cropStart}
                  cropEnd={state.cropEnd}
                  onChange={handleCropChange}
                />
                <ActionButtons
                  onCancel={handleCancel}
                  onRegenerate={handleRegenerate}
                  onSaveDraft={() => handleSave(false)}
                  onPublish={() => handleSave(true)}
                  isLoading={state.step === 'saving'}
                />
              </>
            )}

            {/* Step: Saving */}
            {state.step === 'saving' && (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Saving episode...</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
