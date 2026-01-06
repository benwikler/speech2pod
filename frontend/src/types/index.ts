export interface GeneratedMetadata {
  speaker: string;
  date: string;
  venue: string;
  topic: string;
  summary: string;
  suggested_title: string;
}

export interface AnalyzeResponse {
  youtube_id: string;
  original_title: string;
  description: string;
  thumbnail_url: string;
  duration_seconds: number;
  upload_date: string;
  uploader: string;
  generated_metadata: GeneratedMetadata;
}

export interface ExtractResponse {
  job_id: string;
  status: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audio_url?: string;
  thumbnail_url?: string;
  duration?: number;
  waveform_data?: number[];
  detected_silence?: {
    start_trim: number;
    end_trim: number;
  };
  error_message?: string;
}

export interface Episode {
  id: number;
  youtube_id: string;
  youtube_url: string;
  original_title: string;
  title: string;
  speaker: string;
  speech_date: string;
  venue: string;
  topic: string;
  summary: string;
  audio_url: string;
  audio_duration: number;
  thumbnail_url: string;
  crop_start: number;
  crop_end: number | null;
  intro_audio_url: string | null;
  outro_audio_url: string | null;
  use_ai_intro: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string | null;
  published_at: string | null;
}

export interface EpisodeCreate {
  youtube_id: string;
  youtube_url: string;
  original_title: string;
  original_description?: string;
  title: string;
  speaker: string;
  speech_date: string;
  venue: string;
  topic: string;
  summary: string;
  audio_url: string;
  audio_duration: number;
  thumbnail_url: string;
  crop_start?: number;
  crop_end?: number;
  status: 'draft' | 'published';
}

export interface FeedInfo {
  title: string;
  description: string;
  feed_url: string;
  published_episodes: number;
  draft_episodes: number;
}

export type AppStep =
  | 'input'
  | 'analyzing'
  | 'preview'
  | 'extracting'
  | 'editing'
  | 'saving';

export interface AppState {
  step: AppStep;
  youtubeUrl: string;
  analyzeData: AnalyzeResponse | null;
  jobId: string | null;
  jobStatus: JobStatusResponse | null;
  metadata: {
    title: string;
    speaker: string;
    date: string;
    venue: string;
    topic: string;
    summary: string;
  };
  cropStart: number;
  cropEnd: number;
  error: string | null;
}
