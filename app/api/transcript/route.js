// app/api/transcript/route.js
// npm i youtube-transcript

import { YoutubeTranscript } from "youtube-transcript";
import { NextResponse } from "next/server";
import { buildSegments, decodeHtml, extractVideoId } from "@/lib/youtube-tools";

async function googleTranslate(text, sourceLang = "auto") {
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=gtx&sl=${sourceLang}&tl=en&dt=t` +
      `&q=${encodeURIComponent(text)}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    if (!res.ok) return text;
    const data = await res.json();
    const translated = data[0]?.map((chunk) => chunk?.[0] ?? "").join("") ?? text;
    return translated.trim() || text;
  } catch {
    return text;
  }
}

async function detectLang(sampleText) {
  try {
    const url =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=gtx&sl=auto&tl=en&dt=t` +
      `&q=${encodeURIComponent(sampleText.slice(0, 150))}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      },
    });

    if (!res.ok) return "auto";
    const data = await res.json();
    return data?.[2] ?? "auto";
  } catch {
    return "auto";
  }
}

// ── SSE streaming handler ─────────────────────────────────────────────────────
// Sends progress events while translating, then a final "done" event with data.

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
    let rawSegments;
    let usedTranslation = false;
    let sourceLang = "auto";

    send({ type: "status", message: "Fetching transcript…", progress: 0 });

    if (lang === "en") {
      try {
        rawSegments = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
      } catch {
        rawSegments = await YoutubeTranscript.fetchTranscript(videoId, {});
        usedTranslation = true;

        send({ type: "status", message: "Detecting language…", progress: 5 });
        const sample = rawSegments.slice(0, 6).map((s) => decodeHtml(s.text)).join(" ");
        sourceLang = await detectLang(sample);
        console.log("[transcript] detected:", sourceLang);
      }
    } else {
      rawSegments = await YoutubeTranscript.fetchTranscript(videoId, {});
    }

    if (!rawSegments?.length) {
      send({ type: "error", message: "No transcript found. This video may not have captions." });
      controller.close();
      return;
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
    }

    const fullTranscript = segments.map((s) => s.text).join(" ");
    const thumbnail    = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const thumbnailHQ  = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

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
    const error = msg.includes("disabled")
      ? "Transcripts are disabled for this video."
      : msg.includes("unavailable") || msg.includes("removed")
      ? "This video is unavailable or has been removed."
      : msg.includes("429") || msg.includes("Too Many")
      ? "YouTube is rate-limiting this server. Wait a moment and try again."
      : `Failed to fetch transcript: ${msg}`;
    send({ type: "error", message: error });
  } finally {
    controller.close();
  }
}

// GET /api/transcript?videoUrl=...&lang=en
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get("videoUrl");
  const lang     = searchParams.get("lang");

  const encoder = new TextEncoder();
  const stream  = new ReadableStream({
    start(controller) {
      handleStreamRequest(videoUrl, lang, controller, encoder);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
    },
  });
}

// POST /api/transcript  { videoUrl, lang }
export async function POST(req) {
  try {
    const { videoUrl, lang } = await req.json();
    const encoder = new TextEncoder();
    const stream  = new ReadableStream({
      start(controller) {
        handleStreamRequest(videoUrl, lang, controller, encoder);
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type":  "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection":    "keep-alive",
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
