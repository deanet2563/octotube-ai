import { supabase } from "../lib/supabase";
import type { LibraryItem } from "../types";

export async function saveToLibrary(videoId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("You must be logged in to save.");

  const { error } = await supabase
    .from("library_items")
    .insert({ user_id: userId, video_id: videoId });

  if (error) {
    if ((error as { code?: string }).code === "23505") {
      return;
    }
    throw error;
  }
}

export async function getLibrary(): Promise<LibraryItem[]> {
  const { data, error } = await supabase
    .from("library_items")
    .select(
      "id, created_at, videos(id, youtube_id, title, channel_name, thumbnail_url, analyses(summary, takeaways, status))"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const video = row.videos;
    const analysesRaw = video?.analyses;
    const analysis = Array.isArray(analysesRaw)
      ? analysesRaw[0] ?? null
      : analysesRaw ?? null;

    return {
      id: row.id,
      created_at: row.created_at,
      video: {
        id: video?.id,
        youtube_id: video?.youtube_id,
        title: video?.title ?? null,
        channel_name: video?.channel_name ?? null,
        thumbnail_url: video?.thumbnail_url ?? null,
        analysis: analysis
          ? {
              summary: analysis.summary ?? null,
              takeaways: analysis.takeaways ?? null,
            }
          : null,
      },
    };
  });
}

export async function removeFromLibrary(libraryItemId: string): Promise<void> {
  const { error } = await supabase
    .from("library_items")
    .delete()
    .eq("id", libraryItemId);

  if (error) throw error;
}
