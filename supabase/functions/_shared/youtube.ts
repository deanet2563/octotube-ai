const SUPADATA_BASE = "https://api.supadata.ai/v1";

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
  durationSeconds: number | null;
}

function supadataKey(): string {
  const key = Deno.env.get("SUPADATA_API_KEY");
  if (!key) throw new Error("SUPADATA_API_KEY is not set");
  return key;
}

export async function fetchVideoMetadata(
  youtubeId: string,
): Promise<VideoMetadata> {
  const res = await fetch(
    `${SUPADATA_BASE}/youtube/video?id=${youtubeId}`,
    { headers: { "x-api-key": supadataKey() } },
  );

  if (!res.ok) {
    return { title: null, channelName: null, thumbnailUrl: null, durationSeconds: null };
  }

  const data = await res.json();
  return {
    title: data.title ?? null,
    channelName: data.channel?.name ?? data.channelTitle ?? null,
    thumbnailUrl: data.thumbnail ?? null,
    durationSeconds: typeof data.duration === "number" ? data.duration : null,
  };
}

export async function fetchTranscript(youtubeId: string): Promise<string> {
  const res = await fetch(
    `${SUPADATA_BASE}/youtube/transcript?videoId=${youtubeId}&text=true`,
    { headers: { "x-api-key": supadataKey() } },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supadata transcript error: ${res.status} ${errText}`);
  }

  const data = await res.json();

  // text=true คืน content เป็น string เดียว; เผื่อกรณีคืนเป็น array of segments ด้วย
  let transcript: string;
  if (typeof data.content === "string") {
    transcript = data.content;
  } else if (Array.isArray(data.content)) {
    transcript = data.content.map((seg: { text: string }) => seg.text).join(" ");
  } else {
    transcript = "";
  }

  if (!transcript.trim()) {
    throw new Error("NO_TRANSCRIPT_AVAILABLE");
  }
  return transcript;
}
