import { Innertube, ClientType } from "youtubei.js";
import { YoutubeTranscript } from "youtube-transcript";

export const TRANSCRIPT_UNAVAILABLE_ERROR =
  "Transcript not available for this video. The owner may have disabled captions.";

export const TRANSCRIPT_UNAVAILABLE_USER_MESSAGE =
  "Transcript unavailable for this video. Try a different video or one with captions enabled.";

export function isTranscriptUnavailableError(message = "") {
  const msg = String(message).toLowerCase();
  return (
    msg.includes("disabled") ||
    msg.includes("not available") ||
    msg.includes("no transcript") ||
    msg.includes("no caption") ||
    msg.includes("could not retrieve") ||
    msg.includes("transcript unavailable")
  );
}

async function createProxiedFetch(proxyUrl) {
  const resolvedProxy = proxyUrl || process.env.PROXY_URL;
  if (!resolvedProxy) {
    return globalThis.fetch.bind(globalThis);
  }

  const { ProxyAgent, fetch: proxiedFetch } = await import("undici");
  const agent = new ProxyAgent(resolvedProxy);

  return (input, init) =>
    proxiedFetch(input, {
      ...init,
      dispatcher: agent,
    });
}

async function createInnertube(options = {}) {
  const fetchFn = await createProxiedFetch(options.proxyUrl);
  const config = {
    generate_session_locally: true,
    retrieve_player: false,
    fetch: fetchFn,
  };

  if (options.clientType) {
    config.client_type = options.clientType;
  }

  return Innertube.create(config);
}

function extractSnippetText(snippet) {
  if (!snippet) return "";
  if (typeof snippet === "string") return snippet;
  if (snippet.text) return snippet.text;
  if (typeof snippet.toString === "function") return snippet.toString();
  return "";
}

function mapYoutubeiSegments(initialSegments) {
  const raw = [];

  for (const seg of initialSegments || []) {
    if (seg?.type === "TranscriptSectionHeader") continue;

    const text = extractSnippetText(seg?.snippet);
    if (!text.trim()) continue;

    raw.push({
      text: text.trim(),
      offset: Number(seg?.start_ms ?? seg?.startMs ?? 0),
    });
  }

  return raw;
}

export async function fetchRawSegmentsWithYoutubei(videoId, options = {}) {
  const yt = await createInnertube(options);
  const info = await yt.getInfo(videoId);
  const transcriptData = await info.getTranscript();
  const segments =
    transcriptData?.transcript?.content?.body?.initial_segments ?? [];

  return mapYoutubeiSegments(segments);
}

async function fetchRawSegmentsWithCaptionTracks(videoId, options = {}) {
  const yt = await createInnertube(options);
  const info = await yt.getBasicInfo(videoId);
  const tracks = info.captions?.caption_tracks;

  if (!tracks?.length) {
    throw new Error("No caption tracks found");
  }

  const preferred =
    tracks.find((track) => track.language_code === "en") || tracks[0];
  const captionUrl = new URL(preferred.base_url);
  captionUrl.searchParams.set("fmt", "json3");

  const fetchFn = await createProxiedFetch(options.proxyUrl);
  const res = await fetchFn(captionUrl.toString());

  if (!res.ok) {
    throw new Error(`Caption track fetch failed (${res.status})`);
  }

  const data = await res.json();
  const raw = [];

  for (const event of data?.events || []) {
    if (!event?.segs) continue;

    const text = event.segs.map((part) => part.utf8 || "").join("").trim();
    if (!text || text === "\n") continue;

    raw.push({
      text,
      offset: Number(event.tStartMs ?? 0),
    });
  }

  return raw;
}

export async function fetchRawSegmentsWithYoutubeTranscript(videoId, lang) {
  let segments;

  if (lang === "en") {
    try {
      segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    } catch {
      segments = await YoutubeTranscript.fetchTranscript(videoId, {});
    }
  } else {
    segments = await YoutubeTranscript.fetchTranscript(videoId, {});
  }

  return (segments || []).map((seg) => ({
    text: seg.text,
    offset: seg.offset ?? 0,
  }));
}

export async function fetchRawTranscriptSegments(videoId, options = {}) {
  const { lang } = options;

  try {
    const segments = await fetchRawSegmentsWithYoutubei(videoId, options);
    if (segments.length) {
      return { segments, source: "youtubei" };
    }
  } catch (err) {
    console.warn("[transcript] youtubei.js failed:", err?.message || err);
  }

  try {
    const segments = await fetchRawSegmentsWithYoutubeTranscript(videoId, lang);
    if (segments.length) {
      return { segments, source: "youtube-transcript" };
    }
  } catch (err) {
    console.warn("[transcript] youtube-transcript failed:", err?.message || err);
  }

  throw new Error(TRANSCRIPT_UNAVAILABLE_ERROR);
}

export async function fetchRawTranscriptSegmentsProxy(videoId, options = {}) {
  const { lang } = options;
  const proxyUrl = options.proxyUrl || process.env.PROXY_URL;

  const strategies = [
    () =>
      fetchRawSegmentsWithYoutubei(videoId, {
        proxyUrl,
        clientType: ClientType.ANDROID,
      }),
    () =>
      fetchRawSegmentsWithYoutubei(videoId, {
        proxyUrl,
        clientType: ClientType.WEB_EMBEDDED,
      }),
    () => fetchRawSegmentsWithCaptionTracks(videoId, { proxyUrl }),
    () => fetchRawSegmentsWithYoutubei(videoId, { proxyUrl }),
    () => fetchRawSegmentsWithYoutubeTranscript(videoId, lang),
  ];

  for (const strategy of strategies) {
    try {
      const segments = await strategy();
      if (segments.length) {
        return { segments, source: "transcript-proxy" };
      }
    } catch (err) {
      console.warn("[transcript-proxy]", err?.message || err);
    }
  }

  throw new Error(TRANSCRIPT_UNAVAILABLE_ERROR);
}
