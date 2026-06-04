"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  List,
  MessageSquareText,
  Send,
  Sparkles,
} from "lucide-react";

const tabs = [
  { id: "summary", label: "Summary", Icon: Sparkles },
  { id: "ask", label: "Ask", Icon: MessageSquareText },
  { id: "notes", label: "Notes", Icon: BookOpen },
  { id: "study", label: "Study", Icon: Brain },
];

function EmptyHint({ activeTab }) {
  const copy = {
    summary: "Generate a focused AI summary with key points and timestamped moments.",
    ask: "Ask a question about the video and get an answer grounded in the transcript.",
    notes: "Generate structured notes, definitions, and action items from the transcript.",
    study: "Create flashcards, quiz questions, and a quick review plan.",
  };

  if (activeTab === "summary") {
    return (
      <div className="flex min-h-90 flex-col items-center justify-center p-8 text-center">
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-fuchsia-400/20 bg-linear-to-br from-fuchsia-500/15 to-cyan-400/10 shadow-2xl shadow-fuchsia-500/10">
          <Sparkles size={42} className="text-fuchsia-300" />
        </div>
        <p className="max-w-sm text-sm leading-6 text-zinc-500">
          Oops, no notes yet. Start summarizing now.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-black/20 p-8 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10">
        <Sparkles size={20} className="text-cyan-300" />
      </div>
      <p className="max-w-sm text-sm leading-6 text-zinc-500">{copy[activeTab]}</p>
    </div>
  );
}

function SummaryView({ data }) {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles size={16} className="text-fuchsia-300" />
          Overview
        </h3>
        <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-black/20 p-4">
          {data.overview?.split("\n\n").map((para, index) => (
            <p key={index} className="text-sm leading-7 text-zinc-400">
              {para}
            </p>
          ))}
        </div>
      </section>

      {!!data.keyPoints?.length && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <List size={16} className="text-cyan-300" />
            Key Points
          </h3>
          <div className="space-y-2">
            {data.keyPoints.map((point, index) => (
              <p
                key={index}
                className="flex gap-3 rounded-xl border border-white/6 bg-white/3 p-3 text-sm leading-6 text-zinc-400"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15 text-[11px] font-semibold text-fuchsia-300">
                  {index + 1}
                </span>
                {point}
              </p>
            ))}
          </div>
        </section>
      )}

      {!!data.timestamps?.length && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Clock size={16} className="text-fuchsia-300" />
            Timestamps
          </h3>
          <div className="space-y-3">
            {data.timestamps.map((item, index) => (
              <div key={index} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <p className="font-mono text-[11px] font-semibold tracking-widest text-fuchsia-300">
                  {item.timestamp}
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-200">{item.heading}</p>
                <p className="mt-1 text-xs leading-6 text-zinc-500">{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function NotesView({ data }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">{data.title || "Video Notes"}</h3>
        <p className="mt-2 text-sm leading-7 text-zinc-400">{data.summary}</p>
      </div>

      {data.sections?.map((section, index) => (
        <section key={index} className="rounded-2xl border border-white/7 bg-white/3 p-4">
          <h4 className="mb-3 text-sm font-semibold text-cyan-200">{section.heading}</h4>
          <div className="space-y-2">
            {section.bullets?.map((bullet, i) => (
              <p key={i} className="flex gap-2 text-sm leading-6 text-zinc-400">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                {bullet}
              </p>
            ))}
          </div>
        </section>
      ))}

      {!!data.definitions?.length && (
        <section>
          <h4 className="mb-3 text-sm font-semibold text-white">Definitions</h4>
          <div className="grid gap-2">
            {data.definitions.map((item, index) => (
              <div key={index} className="rounded-xl border border-white/6 bg-black/20 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">{item.term}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-400">{item.meaning}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StudyView({ data }) {
  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <Brain size={16} className="text-cyan-300" />
          Flashcards
        </h3>
        <div className="grid gap-3">
          {data.flashcards?.map((card, index) => (
            <details key={index} className="group rounded-2xl border border-white/7 bg-white/3 p-4">
              <summary className="cursor-pointer list-none text-sm font-medium text-zinc-200">
                {card.front}
              </summary>
              <p className="mt-3 border-t border-white/6 pt-3 text-sm leading-6 text-zinc-400">
                {card.back}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <HelpCircle size={16} className="text-fuchsia-300" />
          Quiz
        </h3>
        <div className="space-y-3">
          {data.quiz?.map((item, index) => (
            <div key={index} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-sm font-medium text-zinc-200">{item.question}</p>
              <div className="mt-3 grid gap-2">
                {item.choices?.map((choice) => (
                  <div
                    key={choice}
                    className={`rounded-xl border px-3 py-2 text-xs ${
                      choice === item.answer
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-white/6 text-zinc-500"
                    }`}
                  >
                    {choice}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-500">{item.explanation}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AIStudyPanel({ fullTranscript, videoUrl, expanded = false }) {
  const { isSignedIn } = useUser();
  const savedAIState = useMemo(() => {
    if (!videoUrl || typeof window === "undefined") return null;
    try {
      return JSON.parse(
        window.localStorage.getItem(`scriptly.aiStudy.${videoUrl}`) || "null"
      );
    } catch {
      window.localStorage.removeItem(`scriptly.aiStudy.${videoUrl}`);
      return null;
    }
  }, [videoUrl]);

  const [activeTab, setActiveTab] = useState("summary");
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState(savedAIState?.answers || []);
  const [summary, setSummary] = useState(savedAIState?.summary || null);
  const [notes, setNotes] = useState(savedAIState?.notes || null);
  const [study, setStudy] = useState(savedAIState?.study || null);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [aiReady, setAiReady] = useState(null);

  useEffect(() => {
    if (!videoUrl) return;

    const payload = {
      summary,
      notes,
      study,
      answers,
    };

    if (!summary && !notes && !study && answers.length === 0) {
      window.localStorage.removeItem(`scriptly.aiStudy.${videoUrl}`);
      return;
    }

    window.localStorage.setItem(
      `scriptly.aiStudy.${videoUrl}`,
      JSON.stringify(payload)
    );
  }, [videoUrl, summary, notes, study, answers]);

  useEffect(() => {
    let cancelled = false;

    async function checkAiBackend() {
      try {
        const res = await fetch("/api/ai/health");
        const data = await res.json();
        if (!cancelled) setAiReady(res.ok && data?.ok === true);
      } catch {
        if (!cancelled) setAiReady(false);
      }
    }

    checkAiBackend();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasTranscript = Boolean(fullTranscript?.trim());
  const generated = useMemo(() => ({ summary, notes, study }), [summary, notes, study]);
  const hasGeneratedContent = Boolean(
    summary || notes || study || answers.length
  );
  const aiBackendUnavailable = aiReady === false;

  const runAi = async (mode, extra = {}) => {
    if (!hasTranscript) return;
    if (aiBackendUnavailable) {
      setError(
        "AI backend is unavailable. Start Ollama and refresh the page, or check /api/ai/health."
      );
      return;
    }

    setLoading(mode);
    setError(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, fullTranscript, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI request failed");

      if (mode === "ask") {
        setAnswers((items) => [{ question: extra.question, ...data }, ...items]);
        setQuestion("");
      }
      if (mode === "summary") setSummary(data);
      if (mode === "notes") setNotes(data);
      if (mode === "study") setStudy(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  const submitQuestion = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    runAi("ask", { question });
  };

  return (
    <div className={`flex flex-col rounded-2xl ${expanded ? "min-h-160 p-5" : "h-full min-h-[75vh] bg-white/3 p-5"}`}>
      {/* Tab bar + action buttons */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-white/8 bg-white/4 p-1">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                activeTab === id
                  ? "bg-cyan-400/15 text-cyan-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "summary" && !generated.summary && (
            <button
              onClick={() => runAi("summary")}
              disabled={loading === "summary" || aiBackendUnavailable}
              className="flex items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-fuchsia-500 disabled:opacity-60"
            >
              {loading === "summary" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Summarize
            </button>
          )}

          {hasGeneratedContent && (
            <button
              onClick={async () => {
                if (!isSignedIn) {
                  alert("Please sign in to save AI outputs.");
                  return;
                }
                if (!videoUrl) {
                  alert("Video URL is required to save.");
                  return;
                }
                setSaving(true);
                setSaveMessage(null);

                try {
                  const payload = {
                    transcript: fullTranscript,
                    videoUrl,
                    ask: answers.length > 0 ? answers : undefined,
                  };

                  if (summary) payload.summary = summary;
                  if (notes) payload.notes = notes;
                  if (study) payload.study = study;

                  const res = await fetch("/api/transcripts/save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });

                  const data = await res.json();
                  if (!res.ok) throw new Error(data?.error || "Unable to save AI outputs.");

                  setSaveMessage("Saved AI outputs successfully.");
                } catch (err) {
                  setSaveMessage(err.message || "Unable to save AI outputs.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving || !isSignedIn}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              Save AI outputs
            </button>
          )}
        </div>
      </div>

      {/* Save message banner */}
      {saveMessage && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            saveMessage.startsWith("Saved")
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/20 bg-red-500/10 text-red-200"
          }`}
        >
          {saveMessage}
        </div>
      )}

      {/* Ollama unavailable warning */}
      {aiBackendUnavailable && (
        <div className="mb-4 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
          Ollama is not reachable on the local AI backend. Please start Ollama on your machine and ensure
          it is running at <span className="font-mono">http://127.0.0.1:11434</span>.
        </div>
      )}

      {/* Tab content */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {activeTab === "summary" && (
          <>
            {!generated.summary ? (
              <div className="space-y-4">
                <EmptyHint activeTab="summary" />
                <button
                  onClick={() => runAi("summary")}
                  disabled={loading === "summary"}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-500 disabled:opacity-60"
                >
                  {loading === "summary" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Generate AI Summary
                </button>
              </div>
            ) : (
              <SummaryView data={generated.summary} />
            )}
          </>
        )}

        {activeTab === "ask" && (
          <div className="flex h-full flex-col gap-4">
            <form onSubmit={submitQuestion} className="flex gap-2">
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about this video..."
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-zinc-200 outline-none transition focus:border-cyan-400/60"
              />
              <button
                type="submit"
                disabled={loading === "ask" || !question.trim() || aiBackendUnavailable}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === "ask" ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />}
              </button>
            </form>

            {answers.length === 0 ? (
              <EmptyHint activeTab="ask" />
            ) : (
              <div className="space-y-3">
                {answers.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">{item.question}</p>
                    <p className="mt-3 text-sm leading-7 text-zinc-300">{item.answer}</p>
                    {!!item.supportingPoints?.length && (
                      <div className="mt-3 space-y-1">
                        {item.supportingPoints.map((point, i) => (
                          <p key={i} className="flex gap-2 text-xs leading-5 text-zinc-500">
                            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                            {point}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <>
            {!generated.notes ? (
              <div className="space-y-4">
                <EmptyHint activeTab="notes" />
                <button
                  onClick={() => runAi("notes")}
                  disabled={loading === "notes" || aiBackendUnavailable}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
                >
                  {loading === "notes" ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                  Generate Notes
                </button>
              </div>
            ) : (
              <NotesView data={generated.notes} />
            )}
          </>
        )}

        {activeTab === "study" && (
          <>
            {!generated.study ? (
              <div className="space-y-4">
                <EmptyHint activeTab="study" />
                <button
                  onClick={() => runAi("study")}
                  disabled={loading === "study" || aiBackendUnavailable}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-60"
                >
                  {loading === "study" ? <Loader2 size={16} className="animate-spin" /> : <Brain size={16} />}
                  Build Study Mode
                </button>
              </div>
            ) : (
              <StudyView data={generated.study} />
            )}
          </>
        )}
      </div>
    </div>
  );
}