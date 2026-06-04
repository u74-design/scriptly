"use client";
import { useClerk } from "@clerk/nextjs";
import { X, Sparkles } from "lucide-react";

export default function AuthPromptModal({ onClose, message }) {
  const { openSignIn } = useClerk();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#111] p-8 shadow-2xl">
        
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-500 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/20">
          <Sparkles size={22} className="text-fuchsia-400" />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-white">
          Sign in required
        </h3>

        <p className="mb-6 text-sm text-zinc-400">{message}</p>

        <button
          onClick={() => { onClose(); openSignIn(); }}
          className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-500 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          Create free account
        </button>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-xl py-2 text-sm text-zinc-500 hover:text-white"
        >
          Maybe later
        </button>

      </div>
    </div>
  );
}