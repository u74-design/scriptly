import { useState } from "react";
import TranscriptViewer from "@/components/transcript/TranscriptViewer";
import { X } from "lucide-react";

export default function TranscriptModal({ transcript, videoUrl, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-900 rounded-2xl shadow-2xl border border-white/10 p-6 flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-zinc-800 p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
        >
          <X size={20} />
        </button>
        <h2 className="mb-4 text-xl font-bold text-white">Full Transcript</h2>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <TranscriptViewer videoUrl={videoUrl} initialTranscript={transcript} readOnly />
        </div>
      </div>
    </div>
  );
}
