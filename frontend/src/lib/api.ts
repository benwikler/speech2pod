import axios from 'axios';
import type {
  AnalyzeResponse,
  ExtractResponse,
  JobStatusResponse,
  Episode,
  EpisodeCreate,
  FeedInfo
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Analyze a YouTube URL
export async function analyzeVideo(url: string): Promise<AnalyzeResponse> {
  const response = await api.post<AnalyzeResponse>('/api/analyze', { url });
  return response.data;
}

// Start audio extraction
export async function startExtraction(
  youtube_id: string,
  youtube_url: string
): Promise<ExtractResponse> {
  const response = await api.post<ExtractResponse>('/api/extract', {
    youtube_id,
    youtube_url
  });
  return response.data;
}

// Get extraction job status
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await api.get<JobStatusResponse>(`/api/extract/${jobId}`);
  return response.data;
}

// Crop audio
export async function cropAudio(
  jobId: string,
  startTime: number,
  endTime: number
): Promise<{ audio_url: string; duration: number }> {
  const response = await api.post('/api/crop', {
    job_id: jobId,
    start_time: startTime,
    end_time: endTime,
  });
  return response.data;
}

// Episode CRUD
export async function createEpisode(episode: EpisodeCreate): Promise<Episode> {
  const response = await api.post<Episode>('/api/episodes', episode);
  return response.data;
}

export async function getEpisodes(status?: string): Promise<Episode[]> {
  const params = status ? { status } : {};
  const response = await api.get<Episode[]>('/api/episodes', { params });
  return response.data;
}

export async function getEpisode(id: number): Promise<Episode> {
  const response = await api.get<Episode>(`/api/episodes/${id}`);
  return response.data;
}

export async function updateEpisode(
  id: number,
  update: Partial<Episode>
): Promise<Episode> {
  const response = await api.put<Episode>(`/api/episodes/${id}`, update);
  return response.data;
}

export async function deleteEpisode(id: number): Promise<void> {
  await api.delete(`/api/episodes/${id}`);
}

export async function publishEpisode(id: number): Promise<Episode> {
  const response = await api.post<Episode>(`/api/episodes/${id}/publish`);
  return response.data;
}

export async function unpublishEpisode(id: number): Promise<Episode> {
  const response = await api.post<Episode>(`/api/episodes/${id}/unpublish`);
  return response.data;
}

// Feed info
export async function getFeedInfo(): Promise<FeedInfo> {
  const response = await api.get<FeedInfo>('/api/feed/info');
  return response.data;
}
