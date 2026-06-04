import { NextResponse } from "next/server";
import {
  fetchVideoTranscript,
  getChannelDetails,
  getChannelVideoItems,
} from "@/lib/youtube-tools";

export async function POST(request) {
  try {
    const { sourceUrl, lang = "auto" } = await request.json();
    const safeLimit = 12;

    if (!sourceUrl) {
      return NextResponse.json({ error: "Channel URL required" }, { status: 400 });
    }

    const channel = await getChannelDetails(sourceUrl);
    const videos = await getChannelVideoItems(sourceUrl, safeLimit);

    if (!videos.length) {
      return NextResponse.json(
        { error: "No public videos available" },
        { status: 404 }
      );
    }

    const results = [];
    for (const video of videos) {
      try {
        const transcript = await fetchVideoTranscript(video.videoId, { lang });
        results.push({
          status: "success",
          ...video,
          ...transcript,
        });
      } catch (err) {
        results.push({
          status: "error",
          ...video,
          error: err?.message || "Transcript unavailable",
        });
      }
    }

    return NextResponse.json({
      channel,
      lang,
      totalVideos: results.length,
      successCount: results.filter((item) => item.status === "success").length,
      errorCount: results.filter((item) => item.status === "error").length,
      results,
    });
  } catch (err) {
    console.error("[channel-extract]", err);
    return NextResponse.json(
      { error: err?.message || "Channel extraction failed" },
      { status: 500 }
    );
  }
}
