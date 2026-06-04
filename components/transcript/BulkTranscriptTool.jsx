"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useMemo, useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Languages,
  Loader2,
  RadioTower,
  Search,
  Sparkles,
  ChevronDown,
  FileJson,
  FileType,
  File,
} from "lucide-react";
import jsPDF from "jspdf";

const config = {
  playlist: {
    title: "Playlist Processing",
    eyebrow: "Bulk transcripts",
    description: "Extract transcripts from multiple playlist videos in one focused workflow.",
    placeholder: "https://youtube.com/playlist?list=...",
    Icon: FileText,
    accent: "fuchsia",
  },
  channel: {
    title: "Channel Extraction",
    eyebrow: "Channel transcripts",
    description: "Pull recent videos from a channel and extract available captions in batches.",
    placeholder: "https://youtube.com/@channel or https://youtube.com/channel/UC...",
    Icon: RadioTower,
    accent: "cyan",
  },
};

function downloadJson(payload, name) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function formatTranscriptParagraphs(segments) {
  const paragraphs = [];
  let current = "";
  let sentenceCount = 0;

  for (const segment of segments) {
    const text = segment.text.trim();
    if (!text) continue;

    if (current) current += " ";
    current += text;

    if (/[.!?]["')\]]*$/.test(text)) {
      sentenceCount += 1;
    }

    const words = current.split(/\s+/).filter(Boolean).length;
    if (sentenceCount >= 2 || words >= 70) {
      paragraphs.push(current.trim());
      current = "";
      sentenceCount = 0;
    }
  }

  if (current.trim()) {
    paragraphs.push(current.trim());
  }

  return paragraphs;
}

function downloadText(payload, name) {
  const successes = payload?.results?.filter((item) => item.status === "success") || [];
  const text = successes
    .map((item, index) => {
      const paragraphs = formatTranscriptParagraphs(item.segments);
      return [
        `=== Video ${index + 1} (${item.videoId}) ===`,
        `URL: ${item.videoUrl}`,
        `Words: ${item.wordCount}`,
        ``,
        paragraphs.join("\n\n"),
        ``,
        ``,
      ].join("\n");
    })
    .join("\n");

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadPdf(payload, name) {
  const successes = payload?.results?.filter((item) => item.status === "success") || [];
  if (!successes.length) return;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 40;
  const maxWidth = 520;
  const lineHeight = 16;
  let y = 40;

  const addHeader = (text) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const headerLines = doc.splitTextToSize(text, maxWidth);
    doc.text(headerLines, margin, y, { baseline: "top" });
    y += headerLines.length * 20;
  };

  const addParagraph = (text, options = {}) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(options.size || 11);
    const paragraphLines = doc.splitTextToSize(text, maxWidth);
    doc.text(paragraphLines, margin, y, { baseline: "top" });
    y += paragraphLines.length * (options.lineHeight || lineHeight);
  };

  const addSpacer = (space = 12) => {
    y += space;
  };

  successes.forEach((item, index) => {
    if (index > 0) {
      doc.addPage();
      y = 40;
    }

    addHeader(`Video ${index + 1} · ${item.videoId}`);
    addParagraph(item.videoUrl, { size: 10, lineHeight: 14 });
    addParagraph(`${item.wordCount} words · ${item.lang === "en" ? "English" : item.sourceLang || "Original"}`,
      { size: 10, lineHeight: 14 });
    addSpacer(10);

    const paragraphs = formatTranscriptParagraphs(item.segments);
    paragraphs.forEach((paragraph) => {
      const lines = doc.splitTextToSize(paragraph, maxWidth);
      if (y + lines.length * lineHeight > 740) {
        doc.addPage();
        y = 40;
      }
      doc.text(lines, margin, y, { baseline: "top" });
      y += lines.length * lineHeight;
      addSpacer(8);
    });
  });

  doc.save(`${name}.pdf`);
}

function DownloadDropdown({ payload, type }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options = [
    {
      label: "JSON",
      description: "Full structured data",
      Icon: FileJson,
      action: () => downloadJson(payload, `scriptly-${type}-transcripts.json`),
    },
    {
      label: "Text",
      description: "Plain text file",
      Icon: FileType,
      action: () => downloadText(payload, `scriptly-${type}-transcripts.txt`),
    },
    {
      label: "PDF",
      description: "Print-ready document",
      Icon: File,
      action: () => downloadPdf(payload, `scriptly-${type}-transcripts`),
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-zinc-400 transition hover:bg-white/10 hover:text-white"
        title="Download"
      >
        <Download size={15} />
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/60">
          <p className="border-b border-white/[0.07] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Export as
          </p>
          {options.map(({ label, description, Icon, action }) => (
            <button
              key={label}
              onClick={() => {
                action();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-white/[0.06]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                <Icon size={15} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{label}</p>
                <p className="text-xs text-zinc-600">{description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BulkTranscriptTool({ type }) {
  const settings = config[type];

  // All state initialized to empty/default values so the server and the
  // initial client render are identical — avoiding the hydration mismatch.
  const [sourceUrl, setSourceUrl] = useState("");
  const [translateToEnglish, setTranslateToEnglish] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);
  const [originalPayload, setOriginalPayload] = useState(null);
  const [englishPayload, setEnglishPayload] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { isSignedIn } = useUser();

  // Hydrate from localStorage after mount (client-only, runs once).
  // Keeping this in useEffect ensures SSR and the first client render match.
  useEffect(() => {
    try {
      const saved = JSON.parse(
        window.localStorage.getItem(`scriptly.bulk.${type}`) || "null"
      );
      if (saved) {
        if (saved.sourceUrl) setSourceUrl(saved.sourceUrl);
        if (saved.translateToEnglish) setTranslateToEnglish(saved.translateToEnglish);
        if (saved.payload) setPayload(saved.payload);
        if (saved.originalPayload) setOriginalPayload(saved.originalPayload);
        if (saved.englishPayload) setEnglishPayload(saved.englishPayload);
        if (saved.selectedId) setSelectedId(saved.selectedId);
      }
    } catch {
      window.localStorage.removeItem(`scriptly.bulk.${type}`);
    }
  }, [type]);

  // Persist state to localStorage whenever it changes.
  useEffect(() => {
    if (!sourceUrl && !payload) {
      window.localStorage.removeItem(`scriptly.bulk.${type}`);
      return;
    }

    window.localStorage.setItem(
      `scriptly.bulk.${type}`,
      JSON.stringify({
        sourceUrl,
        translateToEnglish,
        payload,
        originalPayload,
        englishPayload,
        selectedId,
      })
    );
  }, [type, sourceUrl, translateToEnglish, payload, originalPayload, englishPayload, selectedId]);

  const selected = useMemo(() => {
    const successes = payload?.results?.filter((item) => item.status === "success") || [];
    return successes.find((item) => item.videoId === selectedId) || successes[0] || null;
  }, [payload, selectedId]);

  const runExtraction = async (url, langOverride) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    setLoading(true);
    setError(null);
    setPayload(null);
    setSelectedId(null);

    try {
      const res = await fetch("/api/bulk-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          sourceUrl: cleanUrl,
          lang: langOverride ?? (translateToEnglish ? "en" : "auto"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Bulk extraction failed");
      setPayload(data);
      if (data.lang === "en") {
        setEnglishPayload(data);
      } else {
        setOriginalPayload(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const process = (e) => {
    e.preventDefault();
    runExtraction(sourceUrl);
  };

  const handleTranslationChange = async (nextValue) => {
    setTranslateToEnglish(nextValue);
    if (!sourceUrl.trim()) return;

    const desiredLang = nextValue ? "en" : "auto";
    const cached = nextValue ? englishPayload : originalPayload;

    if (cached) {
      setPayload(cached);
      return;
    }

    if (!payload || payload.lang === desiredLang) {
      return;
    }

    await runExtraction(sourceUrl, desiredLang);
  };

  const handlePaste = (e) => {
    if (type !== "channel") return;
    const pasted = e.clipboardData.getData("text").trim();
    if (!pasted) return;
    setSourceUrl(pasted);
    window.setTimeout(() => runExtraction(pasted), 0);
  };

  const saveSelectedTranscript = async () => {
    if (!isSignedIn) {
      alert("Please sign in to save transcripts.");
      return;
    }
    if (!selected) return;

    setSaving(true);
    try {
      const transcriptText = formatTranscriptParagraphs(selected.segments).join("\n\n");
      const res = await fetch("/api/transcripts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcriptText,
          videoUrl: selected.videoUrl,
          sourceType: type,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unable to save transcript.");
      alert("Transcript saved successfully.");
    } catch (err) {
      alert(err.message || "Unable to save transcript.");
    } finally {
      setSaving(false);
    }
  };

  const accentClasses =
    settings.accent === "cyan"
      ? "from-cyan-500/20 to-fuchsia-500/10 text-cyan-300 border-cyan-400/25"
      : "from-fuchsia-500/20 to-violet-500/10 text-fuchsia-300 border-fuchsia-400/25";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_420px] lg:p-8">
          <div>
            <div className={`mb-5 inline-flex items-center gap-2 rounded-xl border bg-gradient-to-r px-3 py-1.5 text-xs ${accentClasses}`}>
              <Sparkles size={14} />
              {settings.eyebrow}
            </div>
            <h1 className="text-3xl font-bold text-white">{settings.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">{settings.description}</p>
          </div>
           
        </div>

        <form onSubmit={process} className="border-t border-white/[0.07] p-4 lg:p-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                onPaste={handlePaste}
                placeholder={settings.placeholder}
                className="w-full rounded-xl border border-white/10 bg-black/30 py-4 pl-11 pr-4 text-sm text-zinc-200 outline-none transition focus:border-fuchsia-500/60"
              />
            </div>
            <button
              disabled={loading || !sourceUrl.trim()}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
              {loading ? "Processing..." : "Start Extraction"}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div className="flex gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8">
          <Loader2 size={26} className="mb-4 animate-spin text-fuchsia-300" />
          <p className="text-sm font-medium text-white">Extracting transcripts</p>
          <p className="mt-1 text-sm text-zinc-500">Resolving videos and checking captions one by one.</p>
        </div>
      )}

      {payload && (
        <section className="grid gap-6 2xl:grid-cols-[460px_1fr]">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 2xl:sticky 2xl:top-24 2xl:max-h-[calc(100vh-7rem)] 2xl:overflow-y-auto">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Results</h2>
                <p className="mt-1 text-xs text-zinc-500">
                  {payload.successCount} extracted, {payload.errorCount} unavailable
                  {payload.lang === "en" ? " · English" : ""}
                  {payload.lang !== "en" ? ` · ${payload.type} captions` : ""}
                </p>
              </div>
              <DownloadDropdown payload={payload} type={type} />
            </div>

            <div className="space-y-2">
              {payload.results.map((item, index) => (
                <button
                  key={item.videoId}
                  onClick={() => item.status === "success" && setSelectedId(item.videoId)}
                  disabled={item.status !== "success"}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selected?.videoId === item.videoId
                      ? "border-fuchsia-400/35 bg-fuchsia-500/10"
                      : "border-white/[0.06] bg-black/20 hover:bg-white/[0.04]"
                  } ${item.status !== "success" ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    {item.status === "success" ? (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={14} className="text-red-400" />
                    )}
                    <p className="min-w-0 flex-1 truncate text-sm text-zinc-200">Video {index + 1}</p>
                    <span className="text-xs text-zinc-600">{item.videoId}</span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {item.status === "success" ? `${item.wordCount} words` : item.error}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-[680px] rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            {selected ? (
              <div className="flex h-full flex-col">
                <div className="mb-5 flex flex-col gap-4 border-b border-white/[0.07] pb-5 md:flex-row md:items-center">
                  <Image
                    src={selected.thumbnail}
                    alt=""
                    width={320}
                    height={180}
                    className="aspect-video w-full rounded-xl object-cover md:w-48"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-white">Extracted Transcript</h3>
                    <p className="mt-1 text-sm text-zinc-500">{selected.wordCount} words available</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <a
                        href={selected.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 transition hover:border-fuchsia-400/35 hover:text-fuchsia-300"
                      >
                        <ExternalLink size={13} />
                        Open video
                      </a>    
                    </div>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto pr-2 space-y-4">
                  {formatTranscriptParagraphs(selected.segments).map((paragraph, idx) => (
                    <p key={idx} className="text-sm leading-7 text-zinc-400">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[520px] items-center justify-center text-center">
                <div>
                  <FileText size={28} className="mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm text-zinc-500">Extracted transcripts will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
