import { NextResponse } from "next/server";
import {
  fetchVideoTranscript,
  getChannelVideoIds,
  getPlaylistVideoIds,
} from "@/lib/youtube-tools";

export async function POST(request) {
  try {
    const { sourceUrl, type, lang = "auto" } = await request.json();
    const safeLimit = 12;

    if (!sourceUrl) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    if (!["playlist", "channel"].includes(type)) {
      return NextResponse.json({ error: "Invalid extraction type" }, { status: 400 });
    }

    const ids =
      type === "playlist"
        ? await getPlaylistVideoIds(sourceUrl, safeLimit)
        : await getChannelVideoIds(sourceUrl, safeLimit);

    if (!ids.length) {
      return NextResponse.json(
        { error: "No videos found for this source." },
        { status: 404 }
      );
    }

    const results = [];

    for (const videoId of ids) {
      try {
        const data = await fetchVideoTranscript(videoId, { lang });
        results.push({ status: "success", ...data });
      } catch (err) {
        results.push({
          status: "error",
          videoId,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          error: err?.message || "Transcript unavailable",
        });
      }
    }

    return NextResponse.json({
      type,
      lang,
      totalVideos: ids.length,
      successCount: results.filter((item) => item.status === "success").length,
      errorCount: results.filter((item) => item.status === "error").length,
      results,
    });
  } catch (err) {
    console.error("[bulk-extract]", err);
    return NextResponse.json(
      { error: err?.message || "Bulk extraction failed" },
      { status: 500 }
    );
  }
}
