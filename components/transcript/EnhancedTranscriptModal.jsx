"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import TranscriptViewer from "@/components/transcript/TranscriptViewer";
import SummaryPanel from "@/components/transcript/SummaryPanel";
import NotesPanel from "@/components/transcript/NotesPanel";

const tabs = [
  { id: "transcript", label: "Transcript" },
  { id: "summary", label: "Summary" },
  { id: "notes", label: "Notes / Script" },
];

export default function EnhancedTranscriptModal({
  videoUrl,
  fullTranscript,
  onClose,
  onSave,
  initialSummary = null,
  initialNotes = null,
  initialStudy = null,
  transcriptOnly = false,
}) {
  const [activeTab, setActiveTab] = useState("transcript");
  const [summary, setSummary] = useState(initialSummary || null);
  const [notes, setNotes] = useState(initialNotes || null);
  const [study, setStudy] = useState(initialStudy || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchSummary() {
    if (!fullTranscript) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "summary",
          fullTranscript,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate summary");
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      setError(err.message || "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotes() {
    if (!fullTranscript) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "notes",
          fullTranscript,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate notes");
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      setError(err.message || "Failed to generate notes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (transcriptOnly) return;
    if (activeTab === "summary" && !summary && fullTranscript) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, summary, fullTranscript, transcriptOnly]);

  useEffect(() => {
    if (transcriptOnly) return;
    if (activeTab === "notes" && !notes && fullTranscript) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, notes, fullTranscript, transcriptOnly]);

  const handleSave = () => {
    if (!onSave) return;
    onSave({ summary, notes, study });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-900 rounded-2xl shadow-2xl border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              transcriptOnly && tab.id !== "transcript" ? null : (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  activeTab === tab.id
                    ? "bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
              )
            ))}
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-zinc-800 p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 size={32} className="animate-spin text-fuchsia-400 mb-3" />
              <p className="text-zinc-400">Generating {activeTab}...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-200">
              {error}
            </div>
          )}

          {!loading && activeTab === "transcript" && (
            <TranscriptViewer videoUrl={videoUrl} initialTranscript={fullTranscript} readOnly />
          )}

          {!loading && activeTab === "summary" && summary && (
            <SummaryPanel data={summary} />
          )}

          {!loading && activeTab === "notes" && notes && (
            <NotesPanel data={notes} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition"
          >
            Close
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-200 hover:bg-fuchsia-500/30 transition"
            >
              Save to Saved
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
