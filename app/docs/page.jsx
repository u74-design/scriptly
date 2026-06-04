  import {
    Brain,
    CheckCircle2,
    Database,
    FileDown,
    FileText,
    Languages,
    Lock,
    PlayCircle,
    RadioTower,
    Search,
    ShieldCheck,
    Mail,
    RefreshCw,
    BookOpen,
  } from "lucide-react";
  import Navbar from "@/components/layout/Navbar";
  import Footer from "@/components/layout/Footer";

  const sections = [
    {
      title: "How Scriptly Works",
      Icon: PlayCircle,
      items: [
        "Paste a YouTube video, playlist, or channel link.",
        "Scriptly resolves the source and fetches available captions or transcript data.",
        "The transcript opens in a focused workspace with search, copy, save, export, and AI tools.",
        "You can summarize the transcript, ask questions, generate notes, or build study material.",
      ],
    },
    {
      title: "Video Transcript Workspace",
      Icon: FileText,
      items: [
        "Single-video transcript extraction with readable timestamp groups.",
        "Video preview, transcript tabs, language controls, copy, save, and download actions.",
        "Search inside long transcripts to quickly find important parts.",
      ],
    },
    {
      title: "AI Study Tool",
      Icon: Brain,
      items: [
        "Summary creates overview notes, key points, and timestamped moments.",
        "Ask lets you question the video and receive answers grounded in the transcript.",
        "Notes creates structured sections, definitions, and action-style learning material.",
        "Study mode builds flashcards, quiz questions, answers, and explanations.",
      ],
    },
    {
      title: "Playlist And Channel Extraction",
      Icon: RadioTower,
      items: [
        "Playlist extraction processes multiple videos from a playlist URL.",
        "Channel extraction pulls recent videos from a channel link or handle.",
        "Results show extracted transcripts, unavailable videos, thumbnails, word counts, and JSON download.",
      ],
    },
    {
      title: "Translation",
      Icon: Languages,
      items: [
        "Original mode keeps the captions as provided by YouTube.",
        "English mode requests English captions when available.",
        "If English captions are missing or not actually English, Scriptly can translate fallback captions.",
      ],
    },
    {
      title: "Exports And History",
      Icon: FileDown,
      items: [
        "TXT export is available for simple transcript saving.",
        "PDF and JSON export are designed for Pro workflows.",
        "Saved and history pages help users revisit previous transcript work.",
      ],
    },
    {
      title: "User Data And Security",
      Icon: ShieldCheck,
      items: [
        "Authentication is handled through Clerk, so account sessions are managed by a dedicated auth provider.",
        "Saved transcript data is tied to the signed-in user account.",
        "Public YouTube links are processed only to fetch transcript and video metadata needed for the workflow.",
        "Users should avoid pasting private or sensitive links unless they are comfortable processing them in the app.",
      ],
    },
    {
      title: "Data Storage",
      Icon: Database,
      items: [
        "Temporary dashboard state can be kept in the browser so refresh does not lose the current transcript.",
        "Saved/history features store transcript records for logged-in users.",
        "Exports are generated for the user to download directly from the browser.",
      ],
    },
    {
      title: "Best Practices",
      Icon: Search,
      items: [
        "Use full YouTube URLs when possible for fastest playlist and channel resolution.",
        "For channels, handles like @channelname and /channel/UC... URLs are supported.",
        "Very long sources can take longer because videos are checked one by one.",
        "Some videos may not have captions, and those will appear as unavailable in bulk results.",
      ],
    },
    {
      title: "Privacy Policy",
      Icon: Lock,
      items: [
        "Scriptly respects your privacy. We only collect information necessary to operate the service.",
        "Your account information (email, name) is managed by Clerk and stored securely.",
        "Transcript data you save is encrypted and associated with your account only.",
        "We do not share, sell, or transmit your personal data to third parties.",
        "YouTube links you process are used only to fetch publicly available transcript and metadata.",
        "Temporary workspace data may be stored in your browser's local storage for convenience.",
        "We use cookies for authentication and session management; you can disable these in browser settings.",
      ],
    },
    {
      title: "Contact",
      Icon: Mail,
      items: [
        "Have questions, feedback, or need support? We'd love to hear from you.",
        "Email us at support@scriptly.com with any inquiries or bug reports.",
        "For feature requests or suggestions, please include details about your use case.",
        "Response time: We aim to respond to all inquiries within 24-48 hours.",
        "For urgent issues, please mark your subject line with [URGENT].",
        "You can also reach us through our website contact form at scriptly.com/contact.",
        "Follow us on social media for updates, tips, and announcements.",
      ],
    },
    {
      title: "Refund Policy",
      Icon: RefreshCw,
      items: [
        "We offer a 30-day money-back guarantee on all Pro and Premium subscriptions.",
        "To request a refund, contact support@scriptly.com with your order ID and reason for request.",
        "Refunds are processed within 5-7 business days and returned to your original payment method.",
        "Refunds are available for unused or dissatisfactory service within the 30-day window.",
        "Cancelled subscriptions are refunded if requested before the next billing cycle.",
        "Custom enterprise plans have a 14-day refund window; terms are specified in your contract.",
        "No refunds are available for one-time purchases like individual transcript exports.",
        "For partial refunds or disputes, please contact our support team for case-by-case review.",
      ],
    },
    {
      title: "Terms and Conditions",
      Icon: BookOpen,
      items: [
        "By using Scriptly, you agree to comply with these Terms and Conditions.",
        "Scriptly is provided 'as-is' without warranties. We are not responsible for service interruptions.",
        "You must be 18 years or older, or have parental consent, to use Scriptly.",
        "You agree not to use Scriptly to process illegal, private, or copyrighted content without permission.",
        "Transcripts are provided for personal, educational, or non-commercial use only.",
        "Redistribution or commercial use of Scriptly's service requires a Business or Enterprise plan.",
        "We reserve the right to suspend or terminate accounts that violate these terms.",
        "Scriptly is not affiliated with YouTube or Google; we are an independent service.",
        "Users are responsible for ensuring their use complies with YouTube's Terms of Service.",
        "We reserve the right to update these terms at any time; changes are effective immediately.",
      ],
    },
  ];

  export default function DocsPage() {
    return (
      <main className="min-h-screen bg-[#08090d] text-white">
        <Navbar />

        <section className="border-b border-white/[0.06] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
              <Lock size={14} />
              Documentation
            </div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
              Learn how Scriptly turns YouTube content into transcripts and study tools.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-500">
              This guide covers how the platform works, what features are available, how data is handled, and what users should know before extracting transcripts.
            </p>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[280px_1fr]">
            <aside className="hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 lg:block lg:self-start lg:sticky lg:top-24">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.28em] text-zinc-600">
                Contents
              </p>
              <div className="space-y-2">
                {sections.map(({ title }) => (
                  <a
                    key={title}
                    href={`#${title.toLowerCase().replaceAll(" ", "-")}`}
                    className="block rounded-xl px-3 py-2 text-sm text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    {title}
                  </a>
                ))}
              </div>
            </aside>

            <div className="space-y-5">
              {sections.map(({ title, Icon, items }) => (
                <section
                  key={title}
                  id={title.toLowerCase().replaceAll(" ", "-")}
                  className="scroll-mt-24 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10">
                      <Icon size={18} className="text-fuchsia-300" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">{title}</h2>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <p key={item} className="flex gap-3 text-sm leading-7 text-zinc-400">
                        <CheckCircle2 size={16} className="mt-1 shrink-0 text-cyan-300" />
                        {item}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }
