"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Bookmark, Brain, Clock, ExternalLink, FileText, History, MessageSquareText, Sparkles, BookOpen, Trash2 } from "lucide-react";

const EnhancedTranscriptModal = dynamic(
  () => import("@/components/transcript/EnhancedTranscriptModal"),
  { ssr: false }
);

const variants = {
  history: {
    accent: "violet",
    emptyIcon: History,
    emptyTitle: "No history yet",
    emptyCopy: "Transcripts you generate will appear here automatically.",
    hoverBorder: "hover:border-violet-500/30",
    hoverText: "hover:text-violet-400",
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-400",
    progress: "bg-violet-500/30",
    button: "border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20",
    glow: "bg-violet-500/5 -right-10",
    linkBorder: "hover:border-violet-500/40",
  },
  saved: {
    accent: "fuchsia",
    emptyIcon: Bookmark,
    emptyTitle: "Nothing saved yet",
    emptyCopy: "Generate a transcript and click the Save button to store it here for quick access.",
    hoverBorder: "hover:border-fuchsia-500/30",
    hoverText: "hover:text-fuchsia-400",
    iconBg: "bg-fuchsia-500/10",
    iconText: "text-fuchsia-400",
    progress: "bg-fuchsia-500/30",
    button: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400 hover:bg-fuchsia-500/20",
    glow: "bg-fuchsia-500/5 -left-10",
    linkBorder: "hover:border-fuchsia-500/40",
  },
};

export default function TranscriptList({ transcripts, type = "history" }) {
  const [activeTranscripts, setActiveTranscripts] = useState(transcripts);
  const [modal, setModal] = useState({ open: false, transcript: null, videoUrl: null });
  const variant = variants[type] ?? variants.history;
  const EmptyIcon = variant.emptyIcon;

  const handleRemoveSaved = async (id) => {
    try {
      const res = await fetch("/api/transcripts/unsave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to remove saved transcript");
      setActiveTranscripts((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      alert("Unable to remove this saved transcript.");
    }
  };

  return (
    <>
      {activeTranscripts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] py-24 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5">
            <EmptyIcon size={28} className="text-zinc-600" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-zinc-300">{variant.emptyTitle}</h3>
          <p className="max-w-sm text-sm text-zinc-600">{variant.emptyCopy}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeTranscripts.map((t, index) => (
            (() => {
              const transcriptOnly = type === "saved" && t.sourceType === "playlist";

              return (
            <div
              key={t.id}
              className={`group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 ${variant.hoverBorder} hover:bg-white/[0.05]`}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className={`absolute top-10 h-40 w-40 rounded-full ${variant.glow} blur-2xl`} />
              </div>

              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${variant.iconBg}`}>
                    <FileText size={14} className={variant.iconText} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">
                        Transcript #{activeTranscripts.length - index}
                      </p>
                      {t.saved && type === "history" && (
                        <span className="flex items-center gap-1 rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-xs text-fuchsia-400">
                          <Bookmark size={10} className="fill-fuchsia-400" />
                          Saved
                        </span>
                      )}
                    </div>

                    {type === "history" ? (
                      <p className="mt-1 text-xs text-zinc-500">{t.action || "Performed action"}</p>
                    ) : (
                      <>
                        <p className="mt-1 text-xs text-zinc-500">Exact transcript text extracted from the video.</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                          {!transcriptOnly && t.summary && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2 py-1 text-fuchsia-300">
                              <Sparkles size={12} /> Summary
                            </span>
                          )}
                          {!transcriptOnly && t.notes && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-cyan-300">
                              <BookOpen size={12} /> Notes
                            </span>
                          )}
                          {!transcriptOnly && t.study && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-300">
                              <Brain size={12} /> Study
                            </span>
                          )}
                          {!transcriptOnly && t.ask?.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-violet-300">
                              <MessageSquareText size={12} /> Ask {t.ask.length}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-600">
                          <Clock size={11} />
                          {new Date(t.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <a
                  href={t.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition ${variant.linkBorder} ${variant.hoverText}`}
                >
                  <ExternalLink size={12} />
                  View Video
                </a>
              </div>

              <p className="line-clamp-3 text-sm leading-7 text-zinc-400">{t.transcript}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="h-1 flex-1 min-w-[160px] overflow-hidden rounded-full bg-white/5">
                  <div className={`h-full w-1/3 rounded-full ${variant.progress}`} />
                </div>
                <span className="text-xs text-zinc-600">
                  {t.transcript.split(" ").length} words • Saved on {new Date(t.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <button
                  className={`rounded-lg border px-3 py-1.5 text-xs transition hover:text-white ${variant.button}`}
                  onClick={() => setModal({ open: true, transcript: t.transcript, videoUrl: t.videoUrl, summary: t.summary || null, notes: t.notes || null, study: t.study || null, transcriptOnly })}
                >
                  View Full Transcript
                </button>
                {type === "saved" && (
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 transition hover:border-red-400/30 hover:bg-red-500/20"
                    onClick={() => handleRemoveSaved(t.id)}
                  >
                    <Trash2 size={14} />
                    Remove from Saved
                  </button>
                )}
              </div>
            </div>
              );
            })()
          ))}
        </div>
      )}

      {modal.open && (
        <EnhancedTranscriptModal
          videoUrl={modal.videoUrl}
          fullTranscript={modal.transcript}
          initialSummary={modal.summary}
          initialNotes={modal.notes}
          initialStudy={modal.study}
          transcriptOnly={modal.transcriptOnly}
          onClose={() => setModal({ open: false, transcript: null, videoUrl: null, summary: null, notes: null, study: null, transcriptOnly: false })}
        />
      )}
    </>
  );
}
