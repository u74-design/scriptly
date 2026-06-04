import {
  Bookmark,
  Brain,
  Captions,
  Download,
  FileText,
  Languages,
  ListVideo,
  RadioTower,
  Search,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const features = [
  {
    title: "YouTube Transcript Extraction",
    description: "Paste a YouTube video URL and Scriptly fetches readable captions with timestamps.",
    Icon: Captions,
  },
  {
    title: "AI Summary",
    description: "Generate overview notes, key points, and important moments from long videos.",
    Icon: Sparkles,
  },
  {
    title: "AI Study Tool",
    description: "Ask questions, generate notes, build flashcards, and create quiz-style review material.",
    Icon: Brain,
  },
  {
    title: "Playlist Extraction",
    description: "Extract transcripts from multiple videos in a playlist and review them in one place.",
    Icon: ListVideo,
  },
  {
    title: "Channel Extraction",
    description: "Paste a channel link and pull recent video transcripts for research or content analysis.",
    Icon: RadioTower,
  },
  {
    title: "Translation",
    description: "Translate available captions to English for playlist, channel, and video workflows.",
    Icon: Languages,
  },
  {
    title: "Exports",
    description: "Download transcripts as TXT, PDF, JSON, or complete bulk extraction files.",
    Icon: Download,
  },
  {
    title: "History And Saved Work",
    description: "Keep important transcripts and return to previous research without starting again.",
    Icon: Bookmark,
  },
  {
    title: "Searchable Reading Workspace",
    description: "Scan, search, copy, save, and navigate transcripts inside a focused dashboard layout.",
    Icon: Search,
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#08090d] text-white">
      <Navbar />

      <section className="border-b border-white/[0.06] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-300">
            <FileText size={14} />
            Scriptly features
          </div>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white md:text-6xl">
            Everything you need to turn videos into useful study material.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-500">
            Scriptly combines transcript extraction, summaries, translation, exports, and study tools in one dashboard built for creators, students, and researchers.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map(({ title, description, Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition hover:border-fuchsia-400/25 hover:bg-white/[0.05]"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
                <Icon size={19} className="text-cyan-300" />
              </div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-500">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
