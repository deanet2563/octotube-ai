import { supabase } from "../lib/supabase";

export async function saveToLibrary(videoId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("You must be logged in to save.");

  const { error } = await supabase
    .from("library_items")
    .insert({ user_id: userId, video_id: videoId });

  if (error) {
    // 23505 = unique violation = already saved → treat as success
    if ((error as { code?: string }).code === "23505") {
      return;
    }
    throw error;
  }
}
