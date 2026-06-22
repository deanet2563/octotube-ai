import { supabase } from "../lib/supabase";
import type { AnalyzeResult } from "../types";

export async function analyzeVideo(videoUrl: string): Promise<AnalyzeResult> {
  const { data, error } = await supabase.functions.invoke("analyze", {
    body: { videoUrl },
  });

  if (error) {
    let message = "Something went wrong. Please try again.";
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const body = await ctx.json();
        if (body?.error) message = body.error as string;
      } catch {
        // ignore parse errors, keep default message
      }
    }
    throw new Error(message);
  }

  return data as AnalyzeResult;
}
