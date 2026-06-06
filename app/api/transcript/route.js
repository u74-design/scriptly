// app/api/transcript/route.js

import { NextResponse } from "next/server";
import {
  TRANSCRIPT_UNAVAILABLE_ERROR,
  fetchRawTranscriptSegments,
} from "@/lib/transcript-fetch";
import {
  buildSegments,
  decodeHtml,
  detectLang,
  extractVideoId,
  googleTranslate,
} from "@/lib/youtube-tools";

export const maxDuration = 30;

function sseEvent(data) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function handleStreamRequest(videoUrl, lang, controller, encoder) {
  const send = (payload) => {
    controller.enqueue(encoder.encode(sseEvent(payload)));
  };

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    send({ type: "error", message: "Invalid YouTube URL or video ID." });
    controller.close();
    return;
  }

  try {
    let usedTranslation = false;
    let sourceLang = "auto";

    send({ type: "status", message: "Fetching transcript…", progress: 0 });

    const { segments: rawSegments } = await fetchRawTranscriptSegments(videoId, { lang });

    if (!rawSegments?.length) {
      send({ type: "error", message: TRANSCRIPT_UNAVAILABLE_ERROR });
      controller.close();
      return;
    }

    if (lang === "en") {
      const built = buildSegments(rawSegments);
      const sample = built.slice(0, 6).map((seg) => seg.text).join(" ");
      sourceLang = await detectLang(sample);

      if (sourceLang && sourceLang !== "auto" && !sourceLang.startsWith("en")) {
        usedTranslation = true;
        send({ type: "status", message: "Detecting language…", progress: 5 });
      }
    }

    let segments = buildSegments(rawSegments);

    if (usedTranslation) {
      const CONCURRENCY = 20;
      const total = segments.length;
      const translated = [...segments];

      for (let i = 0; i < total; i += CONCURRENCY) {
        const batch = segments.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          batch.map((seg) => googleTranslate(seg.text, sourceLang))
        );
        results.forEach((text, j) => {
          translated[i + j] = { ...segments[i + j], text };
        });

        const done = Math.min(i + CONCURRENCY, total);
        const progress = Math.round((done / total) * 100);
        send({
          type: "progress",
          message: `Translating… ${done} / ${total} segments`,
          progress,
        });
      }

      segments = translated;
    } else if (lang === "en") {
      const sample = segments.slice(0, 6).map((s) => decodeHtml(s.text)).join(" ");
      sourceLang = await detectLang(sample);
    }

    const fullTranscript = segments.map((s) => s.text).join(" ");
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const thumbnailHQ = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    send({
      type: "done",
      segments,
      fullTranscript,
      videoId,
      thumbnail,
      thumbnailHQ,
      translatedByAI: usedTranslation,
      sourceLang,
    });
  } catch (err) {
    console.error("[transcript] ERROR:", err);
    const msg = err?.message ?? "";
    const error = msg.includes("disabled") || msg.includes("not available")
      ? TRANSCRIPT_UNAVAILABLE_ERROR
      : msg.includes("unavailable") || msg.includes("removed")
      ? "This video is unavailable or has been removed."
      : msg.includes("429") || msg.includes("Too Many")
      ? "YouTube is rate-limiting this server. Wait a moment and try again."
      : msg || TRANSCRIPT_UNAVAILABLE_ERROR;
    send({ type: "error", message: error });
  } finally {
    controller.close();
  }
}

// GET /api/transcript?videoUrl=...&lang=en
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get("videoUrl");
  const lang = searchParams.get("lang");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      handleStreamRequest(videoUrl, lang, controller, encoder);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// POST /api/transcript  { videoUrl, lang }
export async function POST(req) {
  try {
    const { videoUrl, lang } = await req.json();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        handleStreamRequest(videoUrl, lang, controller, encoder);
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
