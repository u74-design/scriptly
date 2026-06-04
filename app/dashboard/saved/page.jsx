import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import Transcript from "@/models/Transcript";
import { Bookmark } from "lucide-react";
import TranscriptList from "@/components/transcript/TranscriptList";
import ToolPageShell from "@/components/dashboard/ToolPageShell";

export default async function SavedPage() {
  const { userId } = await auth();
  await connectDB();

  const transcripts = await Transcript.find({ userId, saved: true })
    .sort({ createdAt: -1 })
    .lean();

  const serializedTranscripts = transcripts.map((t) => ({
    id: t._id.toString(),
    transcript: t.transcript,
    videoUrl: t.videoUrl,
    summary: t.summary || null,
    notes: t.notes || null,
    study: t.study || null,
    ask: t.ask || [],
    channelId: t.channelId || null,
    channelTitle: t.channelTitle || null,
    channelUrl: t.channelUrl || null,
    sourceType: t.sourceType || "video",
    saved: Boolean(t.saved),
    createdAt: t.createdAt.toISOString(),
  }));

  const groupedTranscripts = Object.values(
    serializedTranscripts.reduce((groups, item) => {
      const key = item.channelId || item.channelUrl || "ungrouped";
      if (!groups[key]) {
        groups[key] = {
          channelId: item.channelId,
          channelTitle: item.channelTitle,
          channelUrl: item.channelUrl,
          items: [],
        };
      }
      groups[key].items.push(item);
      return groups;
    }, {})
  );

  return (
    <ToolPageShell>
      <div className="min-h-screen">
        <main className="p-6 lg:p-10">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-500/20">
              <Bookmark size={20} className="text-fuchsia-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Saved Transcripts</h1>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">
            All saved items store the exact extracted transcript from the original video. Open any
            entry to read the full text, or remove it when you no longer need it.
          </p>
        </div>

        {/* Groups */}
        <div className="space-y-10">
          {groupedTranscripts.map((group) => (
            <section
              key={group.channelId || group.channelUrl || "ungrouped"}
              className="rounded-[2rem] border border-white/[0.08] bg-zinc-950/80 p-6 shadow-2xl shadow-black/30"
            >
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
                    Saved channel group
                  </p>
                  <h2 className="text-2xl font-semibold text-white">
                    {group.channelTitle || "Other saved transcripts"}
                  </h2>
                  {group.channelUrl ? (
                    <a
                      href={group.channelUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-fuchsia-400 hover:text-fuchsia-300"
                    >
                      View channel on YouTube
                    </a>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      Saved items without channel metadata.
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300">
                  {group.items.length} saved item{group.items.length !== 1 ? "s" : ""}
                </div>
              </div>

              <TranscriptList transcripts={group.items} type="saved" />
            </section>
          ))}
        </div>
        </main>
      </div>
    </ToolPageShell>
  );
}
