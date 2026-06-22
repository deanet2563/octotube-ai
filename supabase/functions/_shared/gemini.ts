export interface AnalysisResult {
  summary: string;
  takeaways: string[];
}

const GEMINI_MODEL = "gemini-2.0-flash";

export async function callGemini(
  transcript: string,
  videoTitle: string | null,
): Promise<{ result: AnalysisResult; modelUsed: string }> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const truncated = transcript.slice(0, 30000);

  const prompt =
    `You are summarizing a YouTube video${
      videoTitle ? ` titled "${videoTitle}"` : ""
    }. Based on the transcript below, write a clear summary (3-5 sentences) ` +
    `and 4-7 key takeaways. Respond in the same language as the transcript.\n\n` +
    `Transcript:\n${truncated}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              summary: { type: "STRING" },
              takeaways: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["summary", "takeaways"],
          },
        },
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");

  const result: AnalysisResult = JSON.parse(text);
  return { result, modelUsed: GEMINI_MODEL };
}
