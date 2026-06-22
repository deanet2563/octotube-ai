import { useState } from "react";
import { Header } from "../components/Header";
import { analyzeVideo } from "../services/analyze";
import { saveToLibrary } from "../services/library";
import type { AnalyzeResult } from "../types";

type Status = "idle" | "analyzing" | "done" | "error";
type SaveState = "idle" | "saving" | "saved";

export function Analyze() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  async function handleAnalyze() {
    if (!url.trim() || status === "analyzing") return;
    setStatus("analyzing");
    setError(null);
    setResult(null);
    setSaveState("idle");
    try {
      const data = await analyzeVideo(url.trim());
      setResult(data);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  async function handleSave() {
    if (!result || saveState !== "idle") return;
    setSaveState("saving");
    try {
      await saveToLibrary(result.video.id);
      setSaveState("saved");
    } catch {
      setSaveState("idle");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">Analyze a YouTube video</h1>
        <p className="mt-1 text-gray-500">
          Paste a YouTube URL to get a summary and key takeaways.
        </p>

        <div className="mt-6 flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-gray-900 focus:outline-none"
          />
          <button
            onClick={handleAnalyze}
            disabled={status === "analyzing"}
            className="rounded-lg bg-gray-900 px-5 py-2 font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {status === "analyzing" ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        {status === "analyzing" && (
          <p className="mt-6 text-gray-500">
            Fetching transcript and generating summary… this can take a moment.
          </p>
        )}

        {status === "error" && error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {status === "done" && result && (
          <div className="mt-8">
            <div className="flex items-start gap-4">
              {result.video.thumbnail_url && (
                <img src={result.video.thumbnail_url} alt="" className="w-40 rounded-lg" />
              )}
              <div>
                <h2 className="font-semibold text-gray-900">
                  {result.video.title ?? "Untitled"}
                </h2>
                <p className="text-sm text-gray-500">{result.video.channel_name}</p>
                {result.cached && (
                  <span className="mt-1 inline-block rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                    from cache
                  </span>
                )}
              </div>
            </div>

            <section className="mt-6">
              <h3 className="font-semibold text-gray-900">Summary</h3>
              <p className="mt-2 whitespace-pre-line text-gray-700">
                {result.analysis.summary}
              </p>
            </section>

            <section className="mt-6">
              <h3 className="font-semibold text-gray-900">Key takeaways</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                {result.analysis.takeaways?.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </section>

            <button
              onClick={handleSave}
              disabled={saveState !== "idle"}
              className="mt-8 rounded-lg border border-gray-900 px-5 py-2 font-medium text-gray-900 hover:bg-gray-900 hover:text-white disabled:opacity-60"
            >
              {saveState === "saved"
                ? "Saved to Library ✓"
                : saveState === "saving"
                ? "Saving…"
                : "Save to Library"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
