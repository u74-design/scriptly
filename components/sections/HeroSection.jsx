"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Search } from "lucide-react";
import Link from "next/link";

const HeroSection = () => {
  const [url, setUrl] = useState("");
  const router = useRouter();

  const handleExtract = () => {
    if (!url.trim()) return;
    router.push(`/dashboard?url=${encodeURIComponent(url)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleExtract();
  };

  return (
    <section className="relative overflow-hidden pt-15 pb-24">

      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#6d28d9_0%,transparent_35%)] opacity-25" />

      <div className="relative mx-auto max-w-5xl text-center px-6">

        {/* Badge */}
        <div className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300">
          AI-Powered Transcript Platform
        </div>

        {/* Headline */}
        <h1 className="mt-8 text-5xl md:text-7xl font-bold tracking-tight text-white">
          Turn YouTube Videos
          <span className="block text-violet-400">
            Into Searchable Knowledge
          </span>
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          Extract, organize and manage transcripts from YouTube videos,
          playlists and channels with a fast and scalable workflow.
        </p>

        {/* ── Input bar ── */}
        <div className="mt-10 mx-auto max-w-3xl rounded-3xl border border-white/10 bg-zinc-950/70 p-4 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4">
              <Search className="h-5 w-5 shrink-0 text-zinc-500" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-transparent outline-none text-zinc-200 placeholder:text-zinc-500"
              />
            </div>
            <button
              onClick={handleExtract}
              className="rounded-2xl bg-violet-600 px-7 py-4 font-semibold text-white transition hover:bg-violet-500"
            >
              Extract Transcript
            </button>
          </div>
          <p className="mt-3 text-center text-sm text-zinc-500">
            Start Extracting Instantly — paste a YouTube video, playlist or channel link and begin immediately.
          </p>
        </div>

        {/* ── CTA buttons ── */}
        <div className="mt-5 flex flex-col md:flex-row justify-center gap-4">
          <Button
            variant="outline"
            className="rounded-xl border-zinc-800 bg-zinc-950 px-8 py-6 text-white hover:bg-zinc-900 hover:text-white"
          >
            Watch Demo
          </Button>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;