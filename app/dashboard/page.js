"use client";

import { Suspense, useCallback, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Edit3, Plus, Share2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import Sidebar from "@/components/dashboard/Sidebar";
import TranscriptInput from "@/components/transcript/TranscriptInput";
import TranscriptViewer from "@/components/transcript/TranscriptViewer";
import EmptyState from "@/components/transcript/EmptyState";
import LoadingState from "@/components/transcript/LoadingState";
import VideoCard from "@/components/transcript/VideoCard";
import AIStudyPanel from "@/components/transcript/AIStudyPanel";
import {
  fetchTranscriptWithFallback,
  formatTranscriptError,
} from "@/lib/transcript-client";
const DASHBOARD_STATE_KEY = "scriptly.dashboard.workspace";

function DashboardContent({ sidebarOpen, setSidebarOpen, sidebarExpanded,  setSidebarExpanded, }) {
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [segments, setSegments] = useState([]);
  const [translatedByAI, setTranslatedByAI] = useState(false);
  const [error, setError] = useState(null);
  const [video, setVideo] = useState(null);
  const [url, setUrl] = useState("");
  const [generated, setGenerated] = useState(false);

  const searchParams = useSearchParams();
  const incomingUrl = searchParams.get("url") || "";

  const handleGenerate = useCallback(async (inputUrl) => {
    try {
      setLoading(true);
      setError(null);
      setTranscript("");
      setVideo(null);
      setUrl(inputUrl);
      setGenerated(false);

      // auto collapse sidebar
      setSidebarOpen(true);
      setSidebarExpanded(false);

      const finalData = await fetchTranscriptWithFallback({
        videoUrl: inputUrl,
        usePost: true,
      });

      setTranscript(finalData.fullTranscript);
      setSegments(finalData.segments ?? []);
      setTranslatedByAI(finalData.translatedByAI ?? false);

      setVideo({
        title: "YouTube Video",
        thumbnail: finalData.thumbnailHQ || finalData.thumbnail || null,
      });

      setGenerated(true);
    } catch (err) {
      console.error("[handleGenerate]", err.message);
      setError(formatTranscriptError(err.message));
    } finally {
      setLoading(false);
    }
  }, [setSidebarOpen, setSidebarExpanded]);

  const handleNew = () => {
      setLoading(false);
      setError(null);
      setTranscript("");
      setSegments([]);
      setTranslatedByAI(false);
      setVideo("");
      setUrl("");
      setGenerated(false);
  }

  useEffect(() => {
    if (incomingUrl || typeof window === "undefined") return;

    let saved;

    try {
      saved = JSON.parse(
        window.localStorage.getItem(DASHBOARD_STATE_KEY) || "null"
      );
    } catch {
      window.localStorage.removeItem(DASHBOARD_STATE_KEY);
      return;
    }

    if (!saved?.url || !saved?.transcript) return;

    const timer = window.setTimeout(() => {
      setUrl(saved.url);
      setTranscript(saved.transcript);
      setSegments(saved.segments || []);
      setTranslatedByAI(saved.translatedByAI || false);
      setVideo(saved.video || null);
      setGenerated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [incomingUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!generated || !url || !transcript) {
      window.localStorage.removeItem(DASHBOARD_STATE_KEY);
      return;
    }

    window.localStorage.setItem(
      DASHBOARD_STATE_KEY,
      JSON.stringify({
        url,
        transcript,
        segments,
        translatedByAI,
        video,
        generated,
      })
    );
  }, [generated, transcript, url, video, segments, translatedByAI]);

  useEffect(() => {
    if (!incomingUrl) return;

    const timer = setTimeout(() => handleGenerate(incomingUrl), 0);

    return () => clearTimeout(timer);
  }, [handleGenerate, incomingUrl]);

  return (
    <main
      className={`flex-1 overflow-y-auto transition-all duration-300 ${
        sidebarOpen ? (sidebarExpanded ? "lg:ml-72" : "lg:ml-16") : "lg:ml-0"
      }`}
    >
      <div className={generated ? "" : "mx-auto max-w-[1700px] p-6 pt-20"}>
        {/* PRE GENERATE */}
        {!generated && (
          <div className="mx-auto max-w-5xl space-y-6">
            <TranscriptInput
              key={incomingUrl || url || "new-transcript"}
              initialUrl={incomingUrl}
              onSubmit={handleGenerate}
            />

            {loading && <LoadingState />}

            {!loading && error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {!loading && !error && !transcript && <EmptyState />}
          </div>
        )}

        {/* POST GENERATE */}
        {generated && !loading && !error && transcript && (
          <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden ">
            <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0d1020]/80 px-5 backdrop-blur-xl">
              <div className="flex min-w-0 items-center gap-3 pl-26">
                <h1 className="truncate text-lg font-semibold text-white">
                  Video transcript and AI study tools
                </h1>
                <Edit3 size={17} className="shrink-0 text-zinc-500" />
              </div>

              <div className="hidden min-w-0 max-w-xl flex-1 lg:block">
                <TranscriptInput
                  key={url}
                  initialUrl={url}
                  onSubmit={handleGenerate}
                  compact
                />
              </div>

              <div className="flex shrink-0 items-center gap-7">
                <button
                onClick={()=>handleNew()}
                className=" hover:cursor-pointer flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110">
                  <Plus size={17} />
                  New
                </button>
              </div>
            </header>

            <section className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-2">
              <div className="min-h-0 min-w-0 overflow-y-auto border-r border-white/[0.08] bg-white/[0.02]">
                <div className="flex justify-center px-6 pb-5 pt-6">
                  {video && (
                    <VideoCard
                      title={video.title}
                      thumbnail={video.thumbnail}
                      videoUrl={url}
                      previewOnly
                    />
                  )}
                </div>

                <TranscriptViewer
                  videoUrl={url}
                  workspace
                  initialSegments={segments}
                  initialTranscript={transcript}
                  initialTranslatedByAI={translatedByAI}
                />
              </div>

              <div className="min-h-0 min-w-0 overflow-y-auto bg-white/[0.01]">
                <AIStudyPanel key={url} fullTranscript={transcript} videoUrl={url} />
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <Sidebar
        isOpen={sidebarOpen}
        expanded={sidebarExpanded}
        onExpandedChange={setSidebarExpanded}
      />

      <div className="flex pt-16">
        <Suspense fallback={<LoadingState />}>
          <DashboardContent
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            sidebarExpanded={sidebarExpanded}
            setSidebarExpanded={setSidebarExpanded}
          />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}
