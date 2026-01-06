import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../lib/api';
import type { EpisodeCreate, Episode } from '../types';

// Analyze video
export function useAnalyzeVideo() {
  return useMutation({
    mutationFn: (url: string) => api.analyzeVideo(url),
  });
}

// Start extraction
export function useStartExtraction() {
  return useMutation({
    mutationFn: ({ youtube_id, youtube_url }: { youtube_id: string; youtube_url: string }) =>
      api.startExtraction(youtube_id, youtube_url),
  });
}

// Poll job status
export function useJobStatus(jobId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => api.getJobStatus(jobId!),
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });
}

// Crop audio
export function useCropAudio() {
  return useMutation({
    mutationFn: ({ jobId, startTime, endTime }: {
      jobId: string;
      startTime: number;
      endTime: number
    }) => api.cropAudio(jobId, startTime, endTime),
  });
}

// Episodes
export function useEpisodes(status?: string) {
  return useQuery({
    queryKey: ['episodes', status],
    queryFn: () => api.getEpisodes(status),
  });
}

export function useEpisode(id: number) {
  return useQuery({
    queryKey: ['episode', id],
    queryFn: () => api.getEpisode(id),
    enabled: !!id,
  });
}

export function useCreateEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (episode: EpisodeCreate) => api.createEpisode(episode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episodes'] });
      queryClient.invalidateQueries({ queryKey: ['feedInfo'] });
    },
  });
}

export function useUpdateEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, update }: { id: number; update: Partial<Episode> }) =>
      api.updateEpisode(id, update),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['episodes'] });
      queryClient.invalidateQueries({ queryKey: ['episode', id] });
    },
  });
}

export function useDeleteEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.deleteEpisode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episodes'] });
      queryClient.invalidateQueries({ queryKey: ['feedInfo'] });
    },
  });
}

export function usePublishEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.publishEpisode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episodes'] });
      queryClient.invalidateQueries({ queryKey: ['feedInfo'] });
    },
  });
}

export function useUnpublishEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.unpublishEpisode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['episodes'] });
      queryClient.invalidateQueries({ queryKey: ['feedInfo'] });
    },
  });
}

// Feed info
export function useFeedInfo() {
  return useQuery({
    queryKey: ['feedInfo'],
    queryFn: () => api.getFeedInfo(),
  });
}
