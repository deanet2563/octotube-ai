import { YoutubeTranscript } from "npm:youtube-transcript@1.2.1";

const ID_PATTERN =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function extractYoutubeId(url: string): string | null {
  const match = url.match(ID_PATTERN);
  return match ? match[1] : null;
}

export interface VideoMetadata {
  title: string | null;
  channelName: string | null;
  thumbnailUrl: string | null;
}

export async function fetchVideoMetadata(
  youtubeId: string,
): Promise<VideoMetadata> {
  const oembedUrl =
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;

  const res = await fetch(oembedUrl);
  if (!res.ok) {
    return { title: null, channelName: null, thumbnailUrl: null };
  }

  const data = await res.json();
  return {
    title: data.title ?? null,
    channelName: data.author_name ?? null,
    thumbnailUrl: data.thumbnail_url ?? null,
  };
}

export async function fetchTranscript(youtubeId: string): Promise<string> {
  const items = await YoutubeTranscript.fetchTranscript(youtubeId);
  if (!items || items.length === 0) {
    throw new Error("NO_TRANSCRIPT_AVAILABLE");
  }
  return items.map((item) => item.text).join(" ");
}
