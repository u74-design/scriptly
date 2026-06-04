import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Transcript from "@/models/Transcript";
import { History } from "lucide-react";
import TranscriptList from "@/components/transcript/TranscriptList";
import ToolPageShell from "@/components/dashboard/ToolPageShell";

export default async function HistoryPage() {
  const { userId } = await auth();
  await connectDB();

  const transcripts = await Transcript.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
  const serializedTranscripts = transcripts.map((t) => ({
    id: t._id.toString(),
    transcript: t.transcript,
    videoUrl: t.videoUrl,
    saved: Boolean(t.saved),
    // Provide a short action/title for history list (avoid showing full transcript/AI outputs)
    action: t.ask && t.ask.length > 0
      ? `Asked: ${t.ask[0].question}`
      : t.summary
      ? "Generated summary"
      : "Transcribed video",
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <ToolPageShell>
      <div className="min-h-screen">
        {/* Header */}
        <div className="mb-10">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/20">
            <History size={20} className="text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">History</h1>
        </div>
        <p className="text-sm text-zinc-500">
          {transcripts.length} transcript{transcripts.length !== 1 ? "s" : ""} generated
        </p>
      </div>

        <TranscriptList transcripts={serializedTranscripts} type="history" />
      </div>
    </ToolPageShell>
  );
}
