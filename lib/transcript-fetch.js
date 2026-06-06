import { Innertube, ClientType } from "youtubei.js";
import { YoutubeTranscript } from "youtube-transcript";

export const TRANSCRIPT_UNAVAILABLE_ERROR =
  "Transcript not available for this video. The owner may have disabled captions.";

export const TRANSCRIPT_UNAVAILABLE_USER_MESSAGE =
  "Transcript unavailable for this video. Try a different video or one with captions enabled.";

const CAPTION_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

const INNERTUBE_CLIENTS = [
  ClientType.ANDROID,
  ClientType.IOS,
  ClientType.MWEB,
  undefined,
];

function logTranscriptError(label, err, extra = {}) {
  console.error(`[transcript] ${label} FULL ERROR:`, err);
  console.error(`[transcript] ${label} MESSAGE:`, err?.message);
  if (Object.keys(extra).length) {
    console.error(`[transcript] ${label} CONTEXT:`, extra);
  }
}

function clientLabel(clientType) {
  if (!clientType) return "WEB";
  return (
    Object.entries(ClientType).find(([, value]) => value === clientType)?.[0] ||
    String(clientType)
  );
}

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
    console.log("[transcript] PROXY_URL not set — using direct fetch");
    return globalThis.fetch.bind(globalThis);
  }

  console.log("[transcript] PROXY_URL is set — routing YouTube requests through proxy");
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

function parseJson3Captions(data) {
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

function parseXmlCaptions(xml) {
  const raw = [];
  const matches = [...xml.matchAll(/<text start="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g)];

  for (const match of matches) {
    const text = match[2]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();

    if (!text) continue;

    raw.push({
      text,
      offset: Math.round(Number(match[1]) * 1000),
    });
  }

  return raw;
}

async function fetchCaptionTrackSegments(captionUrl, fetchFn) {
  const jsonUrl = new URL(captionUrl);
  jsonUrl.searchParams.set("fmt", "json3");

  const jsonRes = await fetchFn(jsonUrl.toString(), {
    headers: CAPTION_FETCH_HEADERS,
  });

  if (jsonRes.ok) {
    const data = await jsonRes.json();
    const segments = parseJson3Captions(data);
    if (segments.length) return segments;
  }

  const xmlUrl = new URL(captionUrl);
  xmlUrl.searchParams.delete("fmt");

  const xmlRes = await fetchFn(xmlUrl.toString(), {
    headers: CAPTION_FETCH_HEADERS,
  });

  if (!xmlRes.ok) {
    throw new Error(`Caption track fetch failed (${xmlRes.status})`);
  }

  const segments = parseXmlCaptions(await xmlRes.text());
  if (!segments.length) {
    throw new Error("Caption track returned no segments");
  }

  return segments;
}

function pickCaptionTrack(tracks, lang) {
  if (!tracks?.length) return null;

  if (lang === "en") {
    return (
      tracks.find((track) => track.language_code === "en" && track.kind !== "asr") ||
      tracks.find((track) => track.language_code?.startsWith("en")) ||
      tracks[0]
    );
  }

  return tracks[0];
}

export async function fetchRawSegmentsWithYoutubei(videoId, options = {}) {
  const yt = await createInnertube(options);
  const info = await yt.getInfo(videoId);
  const transcriptData = await info.getTranscript();
  const segments =
    transcriptData?.transcript?.content?.body?.initial_segments ?? [];

  const mapped = mapYoutubeiSegments(segments);
  if (!mapped.length) {
    throw new Error("youtubei.js returned no transcript segments");
  }

  return mapped;
}

export async function fetchRawSegmentsWithCaptionTracks(videoId, options = {}) {
  const clientTypes = options.clientType
    ? [options.clientType]
    : [ClientType.ANDROID, ClientType.IOS, ClientType.MWEB, undefined];

  const fetchFn = await createProxiedFetch(options.proxyUrl);
  let lastError = new Error("No caption tracks found");

  for (const clientType of clientTypes) {
    try {
      const yt = await createInnertube({ ...options, clientType });
      const info = await yt.getBasicInfo(videoId);
      const tracks = info.captions?.caption_tracks;
      const preferred = pickCaptionTrack(tracks, options.lang);

      if (!preferred?.base_url) {
        throw new Error("No caption tracks found");
      }

      const segments = await fetchCaptionTrackSegments(preferred.base_url, fetchFn);
      if (segments.length) {
        return segments;
      }
    } catch (err) {
      lastError = err;
      logTranscriptError(`caption-tracks:${clientLabel(clientType)}`, err, {
        videoId: options.videoId,
      });
    }
  }

  throw lastError;
}

export async function fetchRawSegmentsWithYoutubeTranscript(videoId, lang) {
  let segments;

  const fetchWithLogging = async (fetchLang) => {
    try {
      const opts = fetchLang ? { lang: fetchLang } : {};
      console.log("[transcript] youtube-transcript attempt:", { videoId, lang: fetchLang || "auto" });
      segments = await YoutubeTranscript.fetchTranscript(videoId, opts);
      console.log("[transcript] youtube-transcript success:", {
        videoId,
        lang: fetchLang || "auto",
        segments: segments?.length ?? 0,
      });
    } catch (err) {
      logTranscriptError(`youtube-transcript:${fetchLang || "auto"}`, err, { videoId });
      throw err;
    }
  };

  if (lang === "en") {
    try {
      await fetchWithLogging("en");
    } catch {
      await fetchWithLogging(null);
    }
  } else {
    await fetchWithLogging(null);
  }

  return (segments || []).map((seg) => ({
    text: seg.text,
    offset: seg.offset ?? 0,
  }));
}

async function runTranscriptStrategies(strategies, context = {}) {
  let lastError = new Error(TRANSCRIPT_UNAVAILABLE_ERROR);

  for (const { name, run } of strategies) {
    console.log("[transcript] trying strategy:", name, context);
    try {
      const segments = await run();
      if (segments?.length) {
        console.log("[transcript] strategy succeeded:", name, {
          ...context,
          segments: segments.length,
        });
        return { segments, strategy: name };
      }

      console.warn("[transcript] strategy returned 0 segments:", name, context);
    } catch (err) {
      lastError = err;
      logTranscriptError(`strategy:${name}`, err, context);
    }
  }

  logTranscriptError("all-strategies-failed", lastError, context);
  throw lastError;
}

function buildTranscriptStrategies(videoId, options = {}) {
  const { lang, proxyUrl } = options;
  const shared = { lang, proxyUrl, videoId };

  return [
    {
      name: "caption-tracks",
      run: () => fetchRawSegmentsWithCaptionTracks(videoId, shared),
    },
    ...INNERTUBE_CLIENTS.map((clientType) => ({
      name: `youtubei:${clientLabel(clientType)}`,
      run: () =>
        fetchRawSegmentsWithYoutubei(videoId, { ...shared, clientType }),
    })),
    {
      name: "youtube-transcript",
      run: () => fetchRawSegmentsWithYoutubeTranscript(videoId, lang),
    },
  ];
}

export async function fetchRawTranscriptSegments(videoId, options = {}) {
  console.log("[transcript] fetch start:", {
    videoId,
    lang: options.lang || "auto",
    hasProxy: Boolean(process.env.PROXY_URL),
    route: "api/transcript",
  });

  const { segments, strategy } = await runTranscriptStrategies(
    buildTranscriptStrategies(videoId, options),
    { videoId, lang: options.lang || "auto", route: "api/transcript" }
  );

  return { segments, source: strategy };
}

export async function fetchRawTranscriptSegmentsProxy(videoId, options = {}) {
  const proxyUrl = options.proxyUrl || process.env.PROXY_URL;

  console.log("[transcript] fetch start:", {
    videoId,
    lang: options.lang || "auto",
    hasProxy: Boolean(proxyUrl),
    route: "api/transcript-proxy",
  });

  const { segments, strategy } = await runTranscriptStrategies(
    buildTranscriptStrategies(videoId, { ...options, proxyUrl }),
    { videoId, lang: options.lang || "auto", route: "api/transcript-proxy" }
  );

  return { segments, source: strategy };
}
