import { fetchRawTranscriptSegments } from "@/lib/transcript-fetch";

export function extractVideoId(input) {
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.hostname === "youtu.be") return url.pathname.slice(1);
    if (url.hostname.includes("youtube.com")) return url.searchParams.get("v");
  } catch {}
  return input.trim();
}

export function extractPlaylistId(input) {
  if (!input) return null;
  try {
    const url = new URL(input);
    return url.searchParams.get("list");
  } catch {}
  return input.trim();
}

function normalizeYouTubeUrl(input) {
  const value = (input || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("@")) return `https://www.youtube.com/${value}`;
  if (value.startsWith("/")) return `https://www.youtube.com${value}`;
  if (value.startsWith("youtube.com/") || value.startsWith("www.youtube.com/")) {
    return `https://${value}`;
  }
  return `https://www.youtube.com/${value}`;
}

async function fetchChannelHtml(url) {
  return await fetchText(url);
}

export function decodeHtml(text) {
  return (text ?? "")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function buildSegments(rawSegments) {
  return rawSegments.map((seg) => {
    const totalSeconds = Math.floor((seg.offset ?? 0) / 1000);
    const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const ss = String(totalSeconds % 60).padStart(2, "0");
    return {
      timestamp: `${mm}:${ss}`,
      text: decodeHtml(seg.text),
      offset: seg.offset ?? 0,
    };
  });
}

function extractJsonFromHtml(html, marker = "ytInitialData") {
  if (!html) return null;
  const index = html.indexOf(marker);
  if (index === -1) return null;

  const start = html.indexOf("{", index);
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < html.length; i += 1) {
    const char = html[i];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      try {
        return JSON.parse(html.slice(start, i + 1));
      } catch {
        return null;
      }
    }
  }

  return null;
}

export async function resolveChannelId(input) {
  const normalizedInput = normalizeYouTubeUrl(input);
  const directId = normalizedInput.match(/(?:channel\/|channel_id=)(UC[\w-]+)/)?.[1];
  if (directId) return directId;

  const candidates = [normalizedInput];
  if (normalizedInput.includes("/@")) {
    if (!normalizedInput.endsWith("/")) {
      candidates.push(`${normalizedInput}/about`, `${normalizedInput}/videos`);
    } else {
      candidates.push(`${normalizedInput}about`, `${normalizedInput}videos`);
    }
  }

  for (const url of candidates) {
    try {
      const html = await fetchChannelHtml(url);
      const id =
        html.match(/"channelId":"(UC[\w-]+)"/)?.[1] ||
        html.match(/"externalId":"(UC[\w-]+)"/)?.[1] ||
        html.match(/\/channel\/(UC[\w-]+)/)?.[1] ||
        html.match(/"browseId":"(UC[\w-]+)"/)?.[1];
      if (id) return id;
    } catch {
      // Try next URL variant.
    }
  }

  return null;
}

export async function getChannelDetails(input) {
  const channelId = await resolveChannelId(input);
  if (!channelId) throw new Error("Could not resolve channel ID.");

  const html = await fetchText(`https://www.youtube.com/channel/${encodeURIComponent(channelId)}`);
  const initialData = extractJsonFromHtml(html, "ytInitialData");
  const header = initialData?.header?.c4TabbedHeaderRenderer || initialData?.header?.c4HeaderRenderer;

  const title =
    header?.title?.simpleText ||
    header?.title?.runs?.map((run) => run.text).join("") ||
    html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] ||
    null;

  const avatar =
    header?.avatar?.thumbnails?.slice(-1)[0]?.url ||
    html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ||
    null;

  const banner =
    header?.banner?.thumbnails?.slice(-1)[0]?.url ||
    html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ||
    null;

  const subscriberCount =
    header?.subscriberCountText?.simpleText ||
    header?.subscriberCountText?.runs?.map((run) => run.text).join("") ||
    null;

  return {
    channelId,
    channelUrl: `https://www.youtube.com/channel/${channelId}`,
    title: title ? decodeHtml(title) : channelId,
    avatar,
    banner,
    subscriberCount,
  };
}

export async function getChannelVideoItems(input, limit = 1000) {
  const channelId = await resolveChannelId(input);
  if (!channelId) throw new Error("Could not resolve channel ID.");

  const xml = await fetchText(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`
  );

  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, limit);

  return entries.map((match) => {
    const entry = match[1];
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || "";
    const title = decodeHtml(entry.match(/<title>([^<]+)<\/title>/)?.[1] || "");
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] || null;
    const thumbnail =
      entry.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1] ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    const durationSeconds = Number(entry.match(/<yt:duration[^>]*seconds="(\d+)"/)?.[1] || 0);
    const duration = durationSeconds
      ? `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, "0")}`
      : null;

    return {
      videoId,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      thumbnail,
      published,
      duration,
    };
  });
}

export async function googleTranslate(text, sourceLang = "auto") {
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

export async function detectLang(sampleText) {
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

async function translateSegmentsToEnglish(segments) {
  const sample = segments.slice(0, 6).map((item) => item.text).join(" ");
  const sourceLang = await detectLang(sample);
  const concurrency = 16;
  const translated = [...segments];

  for (let i = 0; i < segments.length; i += concurrency) {
    const batch = segments.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((segment) => googleTranslate(segment.text, sourceLang))
    );
    results.forEach((text, index) => {
      translated[i + index] = { ...segments[i + index], text };
    });
  }

  return { segments: translated, sourceLang };
}

export async function fetchVideoTranscript(videoId, options = {}) {
  const lang = options.lang || "auto";
  let translatedByAI = false;
  let sourceLang = "auto";

  const { segments: rawSegments } = await fetchRawTranscriptSegments(videoId, { lang });
  let segments = buildSegments(rawSegments || []);

  if (lang === "en" && segments.length) {
    const sample = segments.slice(0, 6).map((item) => item.text).join(" ");
    sourceLang = await detectLang(sample);

    if (sourceLang && sourceLang !== "auto" && !sourceLang.startsWith("en")) {
      const translated = await translateSegmentsToEnglish(segments);
      segments = translated.segments;
      sourceLang = translated.sourceLang;
      translatedByAI = true;
    }
  }

  const fullTranscript = segments.map((item) => item.text).join(" ");

  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    segments,
    fullTranscript,
    wordCount: fullTranscript.split(/\s+/).filter(Boolean).length,
    lang,
    translatedByAI,
    sourceLang,
  };
}

function uniqueVideoIds(ids) {
  return [...new Set(ids.filter(Boolean).map((id) => id.trim()).filter((id) => /^[\w-]{8,}$/.test(id)))];
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`YouTube request failed (${res.status})`);
  return res.text();
}

export async function getPlaylistVideoIds(input, limit = 25) {
  const playlistId = extractPlaylistId(input);
  if (!playlistId) throw new Error("Could not find a playlist ID.");

  const html = await fetchText(`https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`);
  const ids = uniqueVideoIds([
    ...html.matchAll(/"videoId":"([^"]+)"/g),
    ...html.matchAll(/watch\?v=([\w-]{11})/g),
  ].map((match) => match[1]));

  return ids.slice(0, limit);
}

export async function getChannelVideoIds(input, limit = 25) {
  const normalizedInput = normalizeYouTubeUrl(input);
  const directId = normalizedInput.match(/(?:channel\/|channel_id=)(UC[\w-]+)/)?.[1];
  let channelId = directId;

  if (!channelId) {
    const html = await fetchText(normalizedInput);
    channelId =
      html.match(/"channelId":"(UC[\w-]+)"/)?.[1] ||
      html.match(/"externalId":"(UC[\w-]+)"/)?.[1] ||
      html.match(/\/channel\/(UC[\w-]+)/)?.[1];
  }

  if (!channelId) {
    throw new Error("Could not resolve this channel. Try a /channel/UC... URL.");
  }

  const xml = await fetchText(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`
  );
  const ids = uniqueVideoIds([...xml.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>/g)].map((match) => match[1]));

  return ids.slice(0, limit);
}
