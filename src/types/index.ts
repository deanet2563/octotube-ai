export interface Video {
  id: string;
  youtube_id: string;
  title: string | null;
  channel_name: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
}

export interface Analysis {
  id: string;
  video_id: string;
  status: string;
  summary: string | null;
  takeaways: string[] | null;
  model_used: string | null;
}

export interface AnalyzeResult {
  cached: boolean;
  video: Video;
  analysis: Analysis;
}
