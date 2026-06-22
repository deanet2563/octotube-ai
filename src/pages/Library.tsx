import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { getLibrary, removeFromLibrary } from "../services/library";
import type { LibraryItem } from "../types";

export function Library() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getLibrary();
      setItems(data);
    } catch {
      setError("Couldn't load your library. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRemove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
    try {
      await removeFromLibrary(id);
    } catch {
      load();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">Your Library</h1>
        <p className="mt-1 text-gray-500">Videos you've saved.</p>

        {loading && <p className="mt-6 text-gray-500">Loading…</p>}

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="mt-6 text-gray-500">
            No saved videos yet. Analyze a video and tap "Save to Library".
          </p>
        )}

        <div className="mt-6 space-y-4">
          {items.map((item) => {
            const expanded = expandedId === item.id;
            const v = item.video;
            return (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start gap-4">
                  {v.thumbnail_url && (
                    <img src={v.thumbnail_url} alt="" className="w-32 rounded-md" />
                  )}
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-900">
                      {v.title ?? "Untitled"}
                    </h2>
                    <p className="text-sm text-gray-500">{v.channel_name}</p>
                    <div className="mt-2 flex gap-4 text-sm">
                      <button
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        className="text-gray-700 underline"
                      >
                        {expanded ? "Hide" : "View"}
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-red-600 underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>

                {expanded && v.analysis && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <h3 className="font-semibold text-gray-900">Summary</h3>
                    <p className="mt-1 whitespace-pre-line text-gray-700">
                      {v.analysis.summary}
                    </p>
                    <h3 className="mt-4 font-semibold text-gray-900">Key takeaways</h3>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-gray-700">
                      {v.analysis.takeaways?.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
