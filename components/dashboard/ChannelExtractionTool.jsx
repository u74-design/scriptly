"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import EnhancedTranscriptModal from "@/components/transcript/EnhancedTranscriptModal";
import {
  AlertCircle,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Search,
  Sparkles,
  Timer,
} from "lucide-react";

const statusMap = {
  success: {
    label: "Transcript Ready",
    badge: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/15",
    icon: CheckCircle2,
  },
  error: {
    label: "No Transcript",
    badge: "bg-red-500/10 text-red-300 border border-red-500/15",
    icon: AlertCircle,
  },
  processing: {
    label: "Processing",
    badge: "bg-amber-500/10 text-amber-300 border border-amber-500/15",
    icon: Loader2,
  },
};

function formatDate(dateString) {
  if (!dateString) return "Unknown";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

function ActionButton({ icon: Icon, children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-fuchsia-400/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      <Icon size={14} />
      {children}
    </button>
  );
}

export default function ChannelExtractionTool() {
  const { isSignedIn, user } = useUser();

  // All state initialized to empty/default values so server and client
  // first render are identical — avoiding the hydration mismatch.
  const [channelUrl, setChannelUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [fetchingTranscript, setFetchingTranscript] = useState(false);
  const [summarizingAll, setSummarizingAll] = useState(false);

  // Hydrate from localStorage after mount (client-only, runs once).
  // This keeps SSR output and initial client render in sync.
  useEffect(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem("scriptly.channelExtraction") || "null"
      );
      if (saved) {
        if (saved.channelUrl) setChannelUrl(saved.channelUrl);
        if (saved.channel) setChannel(saved.channel);
        if (saved.videos) setVideos(saved.videos);
        if (saved.selectedIds) setSelectedIds(saved.selectedIds);
        if (saved.bookmarkedIds) setBookmarkedIds(saved.bookmarkedIds);
        if (saved.activeVideo) setActiveVideo(saved.activeVideo);
        if (saved.transcript) setTranscript(saved.transcript);
      }
    } catch {
      window.localStorage.removeItem("scriptly.channelExtraction");
    }
  }, []);

  // Persist state to localStorage whenever it changes.
  useEffect(() => {
    if (!channelUrl && !channel && videos.length === 0) {
      window.localStorage.removeItem("scriptly.channelExtraction");
      return;
    }

    window.localStorage.setItem(
      "scriptly.channelExtraction",
      JSON.stringify({
        channelUrl,
        channel,
        videos,
        selectedIds,
        bookmarkedIds,
        activeVideo,
        transcript,
      })
    );
  }, [channelUrl, channel, videos, selectedIds, bookmarkedIds, activeVideo, transcript]);

  const allSelected = useMemo(
    () => videos.length > 0 && selectedIds.length === videos.length,
    [videos, selectedIds]
  );

  const successCount = useMemo(
    () => videos.filter((item) => item.status === "success").length,
    [videos]
  );

  const errorCount = useMemo(
    () => videos.filter((item) => item.status === "error").length,
    [videos]
  );

  const handleExtract = async (e) => {
    e?.preventDefault();
    if (!channelUrl.trim()) return;

    setLoading(true);
    setError(null);
    setChannel(null);
    setVideos([]);
    setSelectedIds([]);

    try {
      const res = await fetch("/api/channel-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: channelUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to extract channel videos.");
      setChannel(data.channel);
      setVideos(data.results || []);
      setSelectedIds(data.results?.map((item) => item.videoId) || []);
    } catch (err) {
      setError(err.message || "Something went wrong while extracting this channel.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(videos.map((item) => item.videoId));
    }
  };

  const saveTranscriptRecord = async ({ videoUrl, transcript, summary = null, notes = null }) => {
    const res = await fetch("/api/transcripts/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        videoUrl,
        summary,
        notes,
        channelId: channel?.channelId ?? null,
        channelTitle: channel?.title ?? null,
        channelUrl: channel?.channelUrl ?? null,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to save transcript.");
    }

    return await res.json();
  };

  const saveVideoById = async (video, metadata = {}) => {
    if (!isSignedIn) {
      alert("Please sign in to save videos.");
      return;
    }

    setFetchingTranscript(true);
    try {
      let transcriptText = transcript;
      if (!activeVideo || activeVideo.videoId !== video.videoId || !transcriptText) {
        const res = await fetch("/api/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: video.videoUrl }),
        });
        transcriptText = await parseTranscriptStream(res);
      }

      await saveTranscriptRecord({
        videoUrl: video.videoUrl,
        transcript: transcriptText,
        summary: metadata.summary,
        notes: metadata.notes,
      });

      setBookmarkedIds((prev) => (prev.includes(video.videoId) ? prev : [...prev, video.videoId]));
      if (!activeVideo || activeVideo.videoId !== video.videoId) {
        setActiveVideo(video);
        setTranscript(transcriptText);
      }
      alert("Video saved successfully!");
    } catch (err) {
      alert("Error saving video: " + err.message);
      console.error(err);
    } finally {
      setFetchingTranscript(false);
    }
  };

  const parseTranscriptStream = async (response) => {
    if (!response.body) {
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
        } catch (parseError) {
          console.error("Bad SSE JSON:", parseError, jsonStr);
        }
      }
    }

    if (serverError) {
      throw new Error(serverError);
    }

    if (!finalData?.fullTranscript) {
      throw new Error("No transcript returned.");
    }

    return finalData.fullTranscript;
  };

  const fetchTranscriptForVideo = async (video) => {
    try {
      setFetchingTranscript(true);
      const res = await fetch("/api/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: video.videoUrl }),
      });

      const fullTranscript = await parseTranscriptStream(res);
      setTranscript(fullTranscript);
      setActiveVideo(video);
    } catch (err) {
      alert("Failed to fetch transcript: " + err.message);
    } finally {
      setFetchingTranscript(false);
    }
  };

  const handleSaveVideo = async (metadata = {}) => {
    if (!activeVideo || !transcript) return;
    await saveVideoById(activeVideo, metadata);
  };

  const handleSummarizeAll = async () => {
    if (!isSignedIn) {
      alert("Please sign in to summarize videos");
      return;
    }
    if (!selectedIds.length) return;

    setSummarizingAll(true);
    const selectedVideos = videos.filter((v) => selectedIds.includes(v.videoId));

    for (const video of selectedVideos) {
      try {
        const res = await fetch("/api/transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: video.videoUrl }),
        });

        const transcriptText = await parseTranscriptStream(res);
        await fetch("/api/transcripts/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: transcriptText,
            videoUrl: video.videoUrl,
          }),
        });
      } catch (err) {
        console.error(`Failed to summarize ${video.title}:`, err);
      }
    }
    setSummarizingAll(false);
    alert("Videos summarized and saved!");
  };

  const openTranscript = (video) => {
    fetchTranscriptForVideo(video);
  };

  const closeTranscript = () => {
    setActiveVideo(null);
    setTranscript(null);
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-zinc-950/80 p-8 shadow-2xl shadow-black/30">
        <div className="max-w-3xl space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-400">Channel extraction</p>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Extract YouTube Channel Videos
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-zinc-400">
              Paste a YouTube channel URL to fetch and manage video transcripts.
            </p>
          </div>

          <form onSubmit={handleExtract} className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <label className="relative block w-full">
              <span className="sr-only">Channel URL</span>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-500">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="https://youtube.com/@channelname"
                className="w-full rounded-[1.5rem] border border-white/[0.10] bg-zinc-950/90 py-5 pl-14 pr-6 text-sm text-white outline-none transition focus:border-fuchsia-400/40 focus:ring-2 focus:ring-fuchsia-500/10"
              />
            </label>
            <Button
              type="submit"
              className="min-w-[180px] px-6 py-8 text-md"
              disabled={loading || !channelUrl.trim()}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Fetching...
                </span>
              ) : (
                "Extract Channel"
              )}
            </Button>
          </form>

          <p className="text-xs text-zinc-500">
            Supports channel IDs and @username URLs. Example: https://youtube.com/@channelname
          </p>
        </div>
      </section>

      {loading && (
        <section className="rounded-[2rem] border border-white/[0.08] bg-zinc-950/80 p-8 text-center shadow-2xl shadow-black/30">
          <Loader2 size={28} className="mx-auto mb-4 animate-spin text-fuchsia-400" />
          <p className="text-lg font-semibold text-white">Fetching channel videos...</p>
          <p className="mt-2 text-sm text-zinc-500">This may take a few moments.</p>
        </section>
      )}

      {error && (
        <section className="rounded-[2rem] border border-red-500/25 bg-red-500/10 p-6 text-sm text-red-200">
          <p className="font-semibold text-red-100">Channel not found</p>
          <p className="mt-1">Please check the URL and try again.</p>
          <p className="mt-2 text-red-100/80">{error}</p>
        </section>
      )}

      {!loading && !error && channel && (
        <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <div className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-zinc-950/80 shadow-2xl shadow-black/30">
            {channel.banner ? (
              <div className="relative h-44 overflow-hidden bg-zinc-900">
                <Image
                  src={channel.banner}
                  alt={`${channel.title} banner`}
                  fill
                  sizes="380px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent" />
              </div>
            ) : (
              <div className="h-44 bg-gradient-to-r from-fuchsia-500/10 via-cyan-500/10 to-violet-500/10" />
            )}

            <div className="space-y-4 p-6">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-[1.5rem] bg-white/5 ring-1 ring-white/10">
                  {channel.avatar ? (
                    <Image
                      src={channel.avatar}
                      alt={`${channel.title} avatar`}
                      fill
                      sizes="80px"
                      loading="eager"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/60">No image</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">Channel overview</p>
                  <h2 className="truncate text-2xl font-semibold text-white">{channel.title}</h2>
                </div>
              </div>

              <div className="grid gap-3 rounded-[1.5rem] border border-white/[0.07] bg-white/5 p-4 text-sm text-zinc-300">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Videos fetched</span>
                  <span>{videos.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Language mode</span>
                  <span>{videos.some((video) => video.lang === "en") ? "English / Auto" : "Original"}</span>
                </div>
              </div>

              <a
                href={channel.channelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.10] bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-fuchsia-400/30 hover:bg-white/10"
              >
                <ExternalLink size={16} />
                Open channel on YouTube
              </a>
            </div>
          </div>

          <div className="space-y-6">
            <div className="sticky top-24 z-20 rounded-[2rem] border border-white/[0.08] bg-zinc-950/95 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Summary</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Channel extraction results</h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    {successCount} ready transcripts, {errorCount} unavailable.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {videos.map((video) => {
                const status = statusMap[video.status] || statusMap.processing;
                const isBookmarked = bookmarkedIds.includes(video.videoId);
                const isSelected = selectedIds.includes(video.videoId);

                return (
                  <div
                    key={video.videoId}
                    className="group overflow-hidden rounded-[2rem] border border-white/[0.08] bg-zinc-950/80 shadow-2xl shadow-black/30 transition hover:-translate-y-1 hover:border-fuchsia-400/20"
                  >
                    <div className="relative overflow-hidden bg-zinc-900" style={{ aspectRatio: "16/9" }}>
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition duration-300 group-hover:brightness-90"
                      />
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-base font-semibold text-white">{video.title}</p>
                          <p className="mt-2 text-xs text-zinc-500">{formatDate(video.published)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveVideoById(video)}
                          className={`rounded-2xl border p-2 text-sm transition ${
                            isBookmarked ? "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-200" : "border-white/10 bg-white/5 text-zinc-300 hover:border-fuchsia-400/30"
                          }`}
                          aria-label={isBookmarked ? "Saved" : "Save video transcript"}
                        >
                          <Bookmark size={16} />
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}>
                          <status.icon size={12} />
                          {status.label}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedIds((prev) =>
                              prev.includes(video.videoId)
                                ? prev
                                : [...prev, video.videoId]
                            )
                          }
                          className={`text-xs font-semibold text-zinc-400 transition hover:text-white ${isSelected ? "text-fuchsia-300" : ""}`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </button>
                      </div>

                      <div className="mt-5 grid gap-3">
                        <ActionButton
                          icon={FileText}
                          disabled={video.status !== "success" || fetchingTranscript}
                          onClick={() => openTranscript(video)}
                        >
                          {fetchingTranscript && activeVideo?.videoId === video.videoId ? (
                            <span className="inline-flex items-center gap-2">
                              <Loader2 size={14} className="animate-spin" />
                            </span>
                          ) : (
                            "View Transcript"
                          )}
                        </ActionButton>
                        <ActionButton
                          icon={Sparkles}
                          disabled={video.status !== "success" || fetchingTranscript}
                          onClick={() => openTranscript(video)}
                        >
                          Generate Summary
                        </ActionButton>
                        <ActionButton
                          icon={ExternalLink}
                          disabled={video.status !== "success" || fetchingTranscript}
                          onClick={() => openTranscript(video)}
                        >
                          Notes / Script
                        </ActionButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {!loading && !error && !channel && (
        <section className="rounded-[2rem] border border-white/[0.08] bg-zinc-950/80 p-12 text-center shadow-2xl shadow-black/30">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Ready when you are</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">No channel loaded yet</h2>
          <p className="mt-3 max-w-xl mx-auto text-sm leading-7 text-zinc-400">
            Paste a YouTube channel URL above to fetch the latest public videos, transcript status, and channel overview.
          </p>
        </section>
      )}

      {activeVideo && transcript && (
        <EnhancedTranscriptModal
          videoUrl={activeVideo.videoUrl}
          fullTranscript={transcript}
          onClose={closeTranscript}
          onSave={isSignedIn ? handleSaveVideo : null}
        />
      )}
    </div>
  );
}
