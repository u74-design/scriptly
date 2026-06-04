"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import {
  Copy, Check, Download, ChevronDown, ChevronUp,
  Search, Bookmark, Loader2, AlertCircle, Languages, Sparkles, Captions, ListTree, FileText,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import AuthPromptModal from "@/components/models/AuthPromptModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HighlightedText = ({ text, keyword }) => {
  if (!keyword) return <>{text}</>;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return (
    <>
      {text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="rounded bg-fuchsia-500/30 px-0.5 text-white">{part}</mark>
        ) : part
      )}
    </>
  );
};

function groupInto25s(segments) {
  if (!segments?.length) return [];
  const BUCKET_MS = 25_000;
  const groups = [];
  let bucket = null;
  for (const seg of segments) {
    const bucketStart = Math.floor(seg.offset / BUCKET_MS) * BUCKET_MS;
    if (!bucket || bucket.startMs !== bucketStart) {
      const totalSec = Math.floor(bucketStart / 1000);
      const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
      const ss = String(totalSec % 60).padStart(2, "0");
      bucket = { timestamp: `${mm}:${ss}`, startMs: bucketStart, lines: [] };
      groups.push(bucket);
    }
    bucket.lines.push(seg);
  }
  return groups;
}

const PREVIEW_WORDS = 30;

// ─── Chunk Card ───────────────────────────────────────────────────────────────

const ChunkCard = ({ chunk, search }) => {
  const [expanded, setExpanded] = useState(false);
  const fullText = chunk.lines.map((l) => l.text).join(" ");
  if (search && !fullText.toLowerCase().includes(search.toLowerCase())) return null;
  const words = fullText.split(" ");
  const isLong = words.length > PREVIEW_WORDS;
  const displayText =
    isLong && !expanded ? words.slice(0, PREVIEW_WORDS).join(" ") + " ..." : fullText;

  return (
    <div className="py-5 border-b border-white/[0.06] last:border-0">
      <span className="inline-block mb-2 text-xs font-mono font-semibold text-fuchsia-400 tracking-widest">
        {chunk.timestamp}
      </span>
      <p className="text-sm leading-7 text-zinc-300">
        <HighlightedText text={displayText} keyword={search} />
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {expanded ? <><ChevronUp size={13} /> Show Less</> : <><ChevronDown size={13} /> Read More</>}
        </button>
      )}
    </div>
  );
};

// ─── Language Toggle ──────────────────────────────────────────────────────────

const LANG_OPTIONS = [
  { value: "auto", label: "Original" },
  { value: "en",   label: "English"  },
];

// ─── Translation Progress Loader ─────────────────────────────────────────────

const TranslationLoader = ({ progress, message }) => (
  <div className="flex flex-col items-center justify-center gap-5 py-16">

    {/* Icon */}
    <div className="relative">
      <Loader2 size={28} className="animate-spin text-fuchsia-400" />
      <Sparkles size={12} className="absolute -top-1 -right-1 text-fuchsia-300 animate-pulse" />
    </div>

    {/* Status message */}
    <div className="text-center space-y-1 w-full max-w-sm px-4">
      <p className="text-sm text-zinc-300">{message || "Translating…"}</p>
      <p className="text-xs text-zinc-600">This may take a moment for long videos</p>
    </div>

    {/* Progress bar + percentage */}
    <div className="w-full max-w-sm px-4 space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Progress</span>
        <span className="tabular-nums font-mono text-fuchsia-400 font-semibold">
          {progress}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>

  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TranscriptViewer = ({
  videoUrl,
  workspace = false,
  initialSegments,
  initialTranscript = "",
  initialTranslatedByAI = false,
}) => {
  const [segments, setSegments]             = useState(initialSegments ?? []);
  const [fullTranscript, setFullTranscript] = useState(initialTranscript);
  const [loading, setLoading]               = useState(!(initialSegments?.length || initialTranscript));
  const [isTranslating, setIsTranslating]   = useState(false);
  const [progress, setProgress]             = useState(0);
  const [progressMsg, setProgressMsg]       = useState("Fetching transcript…");
  const [error, setError]                   = useState(null);
  const [lang, setLang]                     = useState("auto");
  const [translatedByAI, setTranslatedByAI] = useState(initialTranslatedByAI);

  const [copied, setCopied]           = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch]           = useState("");
  const [saved, setSaved]             = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Per-video, per-lang cache so switching back is instant
  const cache = useRef({});

  const { isSignedIn } = useUser();

  // Clear cache when video changes
  useEffect(() => { cache.current = {}; }, [videoUrl]);

  // Only re-run when `videoUrl` or `lang` change. initial* props are used only once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!videoUrl) return;

    if (lang === "auto" && initialSegments?.length && !cache.current[lang]) {
      const result = {
        segments: initialSegments,
        fullTranscript: initialTranscript,
        translatedByAI: initialTranslatedByAI,
      };
      cache.current[lang] = result;
      setSegments(result.segments);
      setFullTranscript(result.fullTranscript);
      setTranslatedByAI(result.translatedByAI);
      setError(null);
      setLoading(false);
      setIsTranslating(false);
    }

    // Cache hit → instant, no fetch
    if (cache.current[lang]) {
      const c = cache.current[lang];
      setSegments(c.segments);
      setFullTranscript(c.fullTranscript);
      setTranslatedByAI(c.translatedByAI);
      setError(null);
      setLoading(false);
      setIsTranslating(false);
      return;
    }

    setLoading(true);
    setIsTranslating(lang === "en");
    setProgress(0);
    setProgressMsg("Fetching transcript…");
    setError(null);
    setSegments([]);
    setFullTranscript("");
    setTranslatedByAI(false);

    const langParam = lang !== "auto" ? `&lang=${lang}` : "";
    const url = `/api/transcript?videoUrl=${encodeURIComponent(videoUrl)}${langParam}`;

    // Use EventSource to read SSE stream
    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === "status") {
          setProgressMsg(data.message);
          setProgress(data.progress ?? 0);
        }

        if (data.type === "progress") {
          setProgressMsg(data.message);
          setProgress(data.progress ?? 0);
        }

        if (data.type === "done") {
          const result = {
            segments:       data.segments ?? [],
            fullTranscript: data.fullTranscript ?? "",
            translatedByAI: data.translatedByAI ?? false,
          };
          // Save to cache
          cache.current[lang] = result;

          setSegments(result.segments);
          setFullTranscript(result.fullTranscript);
          setTranslatedByAI(result.translatedByAI);
          setProgress(100);
          setLoading(false);
          setIsTranslating(false);
          es.close();
        }

        if (data.type === "error") {
          setError(data.message);
          setLoading(false);
          setIsTranslating(false);
          es.close();
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    es.onerror = () => {
      setError("Connection lost. Please try again.");
      setLoading(false);
      setIsTranslating(false);
      es.close();
    };

    return () => es.close();
  }, [videoUrl, lang]);

  const chunks = useMemo(() => groupInto25s(segments), [segments]);

  const visibleChunkCount = useMemo(
    () => chunks.filter((c) =>
      !search || c.lines.some((l) => l.text.toLowerCase().includes(search.toLowerCase()))
    ).length,
    [chunks, search]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullTranscript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { console.error(err); }
  };

  const downloadFile = (content, fileName, type) => {
    const blob = new Blob([content], { type });
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownload = (format) => {
    if (format === "txt")  downloadFile(fullTranscript, "scriptly-transcript.txt", "text/plain");
    if (format === "json") downloadFile(JSON.stringify({ segments, fullTranscript }, null, 2), "scriptly-transcript.json", "application/json");
    if (format === "pdf") {
      const doc = new jsPDF();
      doc.setFontSize(18); doc.text("Scriptly Transcript", 14, 20);
      doc.setFontSize(11); doc.text(doc.splitTextToSize(fullTranscript, 180), 14, 35);
      doc.save("scriptly-transcript.pdf");
    }
    setDropdownOpen(false);
  };

  const handleSave = async () => {
    if (!isSignedIn) { setShowAuthModal(true); return; }
    try {
      const res = await fetch("/api/transcripts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullTranscript, videoUrl }),
        credentials: "include",
      });
      if (res.ok) setSaved(true);
    } catch (err) { console.error("Save error:", err); }
  };

  return (
    <div className={`${workspace ? "h-full p-5" : "rounded-2xl border border-white/10 bg-white/5 p-6"}`}>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-centre justify-between gap-3">

        <div className="flex items-center gap-3 flex-wrap">

          {/* Language Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1">
            <Languages size={14} className="ml-1 text-zinc-500" />
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLang(opt.value)}
                disabled={loading}
                className={`rounded-md px-3 py-1 text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  lang === opt.value
                    ? "bg-fuchsia-500/20 text-fuchsia-400"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          {!loading && !error && (
            <>
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
                  saved
                    ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-400"
                    : "border-white/10 hover:bg-white/10"
                }`}
              >
                <Bookmark size={16} className={saved ? "fill-fuchsia-400 text-fuchsia-400" : ""} />
                {saved ? "Saved!" : "Save"}
              </button>

              {showAuthModal && (
                <AuthPromptModal
                  message="Create a free account to save transcripts."
                  onClose={() => setShowAuthModal(false)}
                />
              )}

              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
              >
                {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy</>}
              </button>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
                >
                  <Download size={16} /> Download <ChevronDown size={16} />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#111] shadow-2xl">
                    {["txt", "json", "pdf"].map((fmt) => (
                      <button key={fmt} onClick={() => handleDownload(fmt)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-white/5">
                        {fmt.toUpperCase()} File
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Translation loader with progress bar */}
      {loading && isTranslating && (
        <TranslationLoader progress={progress} message={progressMsg} />
      )}

      {/* Generic loader (original language fetch) */}
      {loading && !isTranslating && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-500">
          <Loader2 size={28} className="animate-spin text-fuchsia-400" />
          <p className="text-sm">Fetching transcript…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-red-400 text-center max-w-sm">{error}</p>
          {lang === "en" && (
            <button onClick={() => setLang("auto")} className="mt-2 text-xs text-fuchsia-400 hover:underline">
              Try original language instead
            </button>
          )}
        </div>
      )}

      {/* Loaded */}
      {!loading && !error && (
        <>
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <Search size={18} className="text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inside transcript..."
              className="w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500"
            />
          </div>

          {search && (
            <p className="mb-3 text-xs text-zinc-500">
              {visibleChunkCount} block{visibleChunkCount !== 1 ? "s" : ""} matched
            </p>
          )}

        <div className="pr-2">
            {visibleChunkCount === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                No results for &ldquo;{search}&rdquo;
              </p>
            ) : (
              chunks.map((chunk, i) => (
                <ChunkCard key={i} chunk={chunk} search={search} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TranscriptViewer;  
