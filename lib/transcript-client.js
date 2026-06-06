import superjson from "superjson";
import { isTranscriptUnavailableError, TRANSCRIPT_UNAVAILABLE_USER_MESSAGE } from "@/lib/transcript-fetch";

export function formatTranscriptError(message) {
  if (isTranscriptUnavailableError(message)) {
    return TRANSCRIPT_UNAVAILABLE_USER_MESSAGE;
  }
  return message || TRANSCRIPT_UNAVAILABLE_USER_MESSAGE;
}

export async function parseTranscriptSseStream(response) {
  if (!response?.body) {
    throw new Error("No response stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalData = null;
  let serverError = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      if (!event.startsWith("data:")) continue;

      const jsonStr = event.replace(/^data:\s*/, "").trim();

      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === "error") serverError = parsed.message;
        if (parsed.type === "done") finalData = parsed;
      } catch {
        console.error("Bad SSE JSON:", jsonStr);
      }
    }
  }

  if (serverError) {
    throw new Error(serverError);
  }

  if (!finalData?.fullTranscript) {
    throw new Error("No transcript returned.");
  }

  return finalData;
}

export async function fetchTranscriptViaProxy(videoUrl, lang = "auto") {
  const res = await fetch("/api/transcript-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl, lang }),
  });

  const payload = superjson.parse(await res.text());

  if (!res.ok) {
    throw new Error(payload?.error || TRANSCRIPT_UNAVAILABLE_USER_MESSAGE);
  }

  return payload;
}

export async function fetchTranscriptWithFallback({
  videoUrl,
  lang = "auto",
  usePost = false,
  onStatus,
  onProgress,
}) {
  const langParam = lang !== "auto" ? `&lang=${lang}` : "";

  try {
    if (usePost) {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, lang }),
      });

      return await parseTranscriptSseStream(response);
    }

    return await new Promise((resolve, reject) => {
      const url = `/api/transcript?videoUrl=${encodeURIComponent(videoUrl)}${langParam}`;
      const es = new EventSource(url);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "status") {
            onStatus?.(data);
          }

          if (data.type === "progress") {
            onProgress?.(data);
          }

          if (data.type === "done") {
            es.close();
            resolve(data);
          }

          if (data.type === "error") {
            es.close();
            reject(new Error(data.message));
          }
        } catch (err) {
          es.close();
          reject(err);
        }
      };

      es.onerror = () => {
        es.close();
        reject(new Error("Connection lost. Please try again."));
      };
    });
  } catch (err) {
    if (!isTranscriptUnavailableError(err?.message)) {
      throw err;
    }

    return fetchTranscriptViaProxy(videoUrl, lang);
  }
}
