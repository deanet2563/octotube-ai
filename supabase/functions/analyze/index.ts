import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  extractYoutubeId,
  fetchTranscript,
  fetchVideoMetadata,
} from "../_shared/youtube.ts";
import { callGemini } from "../_shared/gemini.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();
    if (!videoUrl || typeof videoUrl !== "string") {
      return jsonResponse({ error: "videoUrl is required" }, 400);
    }

    const youtubeId = extractYoutubeId(videoUrl);
    if (!youtubeId) {
      return jsonResponse({ error: "Could not parse a YouTube video ID from videoUrl" }, 400);
    }

    const { data: existingVideo } = await supabase
      .from("videos")
      .select("id, title, channel_name, thumbnail_url")
      .eq("youtube_id", youtubeId)
      .maybeSingle();

    if (existingVideo) {
      const { data: existingAnalysis } = await supabase
        .from("analyses")
        .select("*")
        .eq("video_id", existingVideo.id)
        .maybeSingle();

      if (existingAnalysis?.status === "complete") {
        return jsonResponse({
          cached: true,
          video: existingVideo,
          analysis: existingAnalysis,
        });
      }

      if (existingAnalysis?.status === "processing") {
        return jsonResponse(
          { error: "Analysis already in progress, please retry shortly" },
          409,
        );
      }
    }

    let videoId: string;

    if (existingVideo) {
      videoId = existingVideo.id;
    } else {
      const metadata = await fetchVideoMetadata(youtubeId);
      const { data: insertedVideo, error: videoErr } = await supabase
        .from("videos")
        .insert({
          youtube_id: youtubeId,
          title: metadata.title,
          channel_name: metadata.channelName,
          thumbnail_url: metadata.thumbnailUrl,
        })
        .select("id")
        .single();

      if (videoErr) throw videoErr;
      videoId = insertedVideo.id;
    }

    const { data: claimedAnalysis, error: claimErr } = await supabase
      .from("analyses")
      .upsert(
        { video_id: videoId, status: "processing", error_message: null },
        { onConflict: "video_id" },
      )
      .select("id")
      .single();

    if (claimErr) throw claimErr;

    let transcript: string;
    try {
      transcript = await fetchTranscript(youtubeId);
    } catch (err) {
      await supabase
        .from("analyses")
        .update({ status: "failed", error_message: "Transcript unavailable for this video" })
        .eq("id", claimedAnalysis.id);
      return jsonResponse({ error: "Transcript unavailable for this video" }, 422);
    }

    const { data: videoRow } = await supabase
      .from("videos")
      .select("title")
      .eq("id", videoId)
      .single();

    let analysisResult;
    let modelUsed: string;
    try {
      const geminiResponse = await callGemini(transcript, videoRow?.title ?? null);
      analysisResult = geminiResponse.result;
      modelUsed = geminiResponse.modelUsed;
    } catch (err) {
      await supabase
        .from("analyses")
        .update({ status: "failed", error_message: String(err) })
        .eq("id", claimedAnalysis.id);
      return jsonResponse({ error: "Failed to generate analysis" }, 500);
    }

    const { data: finalAnalysis, error: updateErr } = await supabase
      .from("analyses")
      .update({
        status: "complete",
        summary: analysisResult.summary,
        takeaways: analysisResult.takeaways,
        model_used: modelUsed,
        error_message: null,
      })
      .eq("id", claimedAnalysis.id)
      .select("*")
      .single();

    if (updateErr) throw updateErr;

    const { data: finalVideo } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .single();

    return jsonResponse({ cached: false, video: finalVideo, analysis: finalAnalysis });
  } catch (err) {
    console.error(err);
    return jsonResponse({ error: "Internal error", detail: String(err) }, 500);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
