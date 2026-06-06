import superjson from "superjson";
import { NextResponse } from "next/server";
import {
  TRANSCRIPT_UNAVAILABLE_ERROR,
  fetchRawTranscriptSegmentsProxy,
} from "@/lib/transcript-fetch";
import { buildSegments, extractVideoId } from "@/lib/youtube-tools";

export const maxDuration = 30;

export async function POST(req) {
  try {
    const { videoUrl, lang = "auto" } = await req.json();
    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL or video ID." }, { status: 400 });
    }

    const { segments: rawSegments } = await fetchRawTranscriptSegmentsProxy(videoId, { lang });
    const segments = buildSegments(rawSegments);
    const fullTranscript = segments.map((seg) => seg.text).join(" ");

    const body = superjson.stringify({
      segments,
      fullTranscript,
      videoId,
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      thumbnailHQ: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      translatedByAI: false,
      sourceLang: "auto",
    });

    return new Response(body, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[transcript-proxy]", err);
    return NextResponse.json(
      { error: err?.message || TRANSCRIPT_UNAVAILABLE_ERROR },
      { status: 404 }
    );
  }
}
