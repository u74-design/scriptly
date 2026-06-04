import { NextResponse } from "next/server";
import { runAiJson } from "@/lib/ai";

const DIRECT_TRANSCRIPT_LIMIT = 20000;
const CHUNK_SIZE = 9000;
const MAX_CHUNKS = 6;

const transcriptSlice = (text) => (text || "").slice(0, DIRECT_TRANSCRIPT_LIMIT);

const outputTokenLimits = {
  ask: 1600,
  summary: 2200,
  notes: 2600,
  study: 1800,
};

const chunkTokenLimits = {
  ask: 900,
  summary: 1200,
  notes: 1400,
  study: 900,
};

function splitTranscriptIntoChunks(text) {
  const normalized = (text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks = [];
  let cursor = 0;

  while (cursor < normalized.length && chunks.length < MAX_CHUNKS) {
    const nextLimit = Math.min(cursor + CHUNK_SIZE, normalized.length);
    let end = nextLimit;

    if (nextLimit < normalized.length) {
      const sentenceEnd = normalized.lastIndexOf(".", nextLimit);
      const wordEnd = normalized.lastIndexOf(" ", nextLimit);
      end = sentenceEnd > cursor + CHUNK_SIZE * 0.65 ? sentenceEnd + 1 : wordEnd;
    }

    if (!end || end <= cursor) end = nextLimit;

    chunks.push(normalized.slice(cursor, end).trim());
    cursor = end;
  }

  return chunks.filter(Boolean);
}

function uniqueStrings(items, limit) {
  const seen = new Set();
  const result = [];

  for (const item of items.flat().filter(Boolean)) {
    const value = String(item).trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;

    seen.add(key);
    result.push(value);
    if (result.length >= limit) break;
  }

  return result;
}

function mergeAiResults(mode, results) {
  if (mode === "summary") {
    return {
      overview: results.map((item) => item.overview).filter(Boolean).join("\n\n"),
      keyPoints: uniqueStrings(results.map((item) => item.keyPoints || []), 16),
      timestamps: results.flatMap((item) => item.timestamps || []).slice(0, 14),
    };
  }

  if (mode === "notes") {
    const definitions = [];
    const seenTerms = new Set();

    for (const item of results.flatMap((result) => result.definitions || [])) {
      const term = String(item?.term || "").trim();
      const key = term.toLowerCase();
      if (!term || seenTerms.has(key)) continue;
      seenTerms.add(key);
      definitions.push(item);
      if (definitions.length >= 12) break;
    }

    return {
      title: results.find((item) => item.title)?.title || "Video Notes",
      summary: results.map((item) => item.summary).filter(Boolean).join("\n\n"),
      sections: results.flatMap((item) => item.sections || []).slice(0, 14),
      definitions,
      actionItems: uniqueStrings(results.map((item) => item.actionItems || []), 12),
    };
  }

  if (mode === "study") {
    return {
      flashcards: results.flatMap((item) => item.flashcards || []).slice(0, 18),
      quiz: results.flatMap((item) => item.quiz || []).slice(0, 12),
      reviewPlan: uniqueStrings(results.map((item) => item.reviewPlan || []), 10),
    };
  }

  if (mode === "ask") {
    const answers = results.map((item) => item.answer).filter(Boolean);
    const confidences = results.map((item) => item.confidence).filter(Boolean);
    const hasHigh = confidences.includes("high");
    const hasMedium = confidences.includes("medium");

    return {
      answer: answers.join("\n\n"),
      supportingPoints: uniqueStrings(
        results.map((item) => item.supportingPoints || []),
        10
      ),
      confidence: hasHigh ? "high" : hasMedium ? "medium" : "low",
    };
  }

  return results[0];
}

async function runAiForTranscript({ mode, fullTranscript, question, useCase }) {
  const chunks = splitTranscriptIntoChunks(fullTranscript);

  if (chunks.length <= 1 && fullTranscript.length <= DIRECT_TRANSCRIPT_LIMIT) {
    return runAiJson({
      messages: prompts[mode]({ fullTranscript, question }),
      temperature: mode === "ask" ? 0.2 : 0.35,
      useCase,
      max_tokens: outputTokenLimits[mode],
    });
  }

  const chunkResults = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunkLabel = `Part ${index + 1} of ${chunks.length}`;
    const result = await runAiJson({
      messages: prompts[mode]({
        fullTranscript: `${chunkLabel}\n\n${chunks[index]}`,
        question,
      }),
      temperature: mode === "ask" ? 0.2 : 0.3,
      useCase,
      max_tokens: chunkTokenLimits[mode],
    });

    chunkResults.push(result);
  }

  return mergeAiResults(mode, chunkResults);
}

const prompts = {
  ask: ({ fullTranscript, question }) => [
    {
      role: "system",
      content:
        "You answer questions using only the supplied YouTube transcript. Be detailed, specific, and useful. Return only valid JSON.",
    },
    {
      role: "user",
      content: `Transcript:\n${transcriptSlice(fullTranscript)}\n\nQuestion: ${question}\n\nCreate a useful answer with enough depth for a learner. Include concrete details from the transcript, explain context, and avoid vague one-line replies. If the transcript does not contain enough evidence, say that clearly.\n\nReturn JSON exactly like:\n{"answer":"clear detailed answer grounded in the transcript","supportingPoints":["specific supporting point from the transcript"],"confidence":"high|medium|low"}\n\nQuantity target:\n- answer: 2-4 focused paragraphs when enough evidence exists\n- supportingPoints: 4-7 points when available`,
    },
  ],
  notes: ({ fullTranscript }) => [
    {
      role: "system",
      content:
        "You turn YouTube transcripts into comprehensive, well-structured study notes. Return only valid JSON.",
    },
    {
      role: "user",
      content: `Transcript:\n${transcriptSlice(fullTranscript)}\n\nGenerate strong study notes that are useful but compact enough to return as complete valid JSON. Cover the important ideas, preserve key details, include examples when the transcript supports them, and organize the material for revision.\n\nReturn JSON exactly like:\n{"title":"clear useful title","summary":"detailed overview","sections":[{"heading":"section title","bullets":["useful bullet with explanation, context, or example"]}],"definitions":[{"term":"term","meaning":"clear meaning with context"}],"actionItems":["specific action or takeaway"]}\n\nQuantity target:\n- sections: 5-8 sections when the transcript has enough content\n- bullets per section: 3-5 useful bullets\n- definitions: 4-8 useful terms when available\n- actionItems: 5-8 practical takeaways`,
    },
  ],
  summary: ({ fullTranscript }) => [
    {
      role: "system",
      content:
        "You summarize YouTube transcripts for study with detailed, useful, structured output. Return only valid JSON.",
    },
    {
      role: "user",
      content: `Transcript:\n${transcriptSlice(fullTranscript)}\n\nCreate a useful summary for a learner. Explain the main ideas, include important details, and make the output useful even for someone who did not watch the video.\n\nReturn JSON exactly like:\n{"overview":"detailed 2-4 paragraph overview","keyPoints":["important point with context"],"timestamps":[{"timestamp":"MM:SS","heading":"short title","description":"1-2 sentence summary of that moment"}]}\n\nQuantity target:\n- keyPoints: 7-10 useful points when available\n- timestamps: 5-8 important moments when available`,
    },
  ],
  study: ({ fullTranscript }) => [
    {
      role: "system",
      content:
        "You create comprehensive study material from YouTube transcripts. Return only valid JSON.",
    },
    {
      role: "user",
      content: `Transcript:\n${transcriptSlice(fullTranscript)}\n\nCreate useful study material for revision and practice. Cover major concepts and practical implications from the transcript while keeping the JSON complete.\n\nReturn JSON exactly like:\n{"flashcards":[{"front":"question or term","back":"clear answer"}],"quiz":[{"question":"question","choices":["A","B","C","D"],"answer":"exact choice text","explanation":"short explanation of why the answer is correct"}],"reviewPlan":["specific review step"]}\n\nQuantity target:\n- flashcards: 5-7 cards\n- quiz: 3-5 questions\n- reviewPlan: 4-5 steps\n- Keep answers and explanations concise so the JSON always completes.`,
    },
  ],
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { mode, fullTranscript, question } = body;
    const useCase = mode === "ask" ? "qa" : mode;

    if (!fullTranscript) {
      return NextResponse.json({ error: "Transcript required" }, { status: 400 });
    }

    if (!prompts[mode]) {
      return NextResponse.json({ error: "Unsupported AI mode" }, { status: 400 });
    }

    if (mode === "ask" && !question?.trim()) {
      return NextResponse.json({ error: "Question required" }, { status: 400 });
    }

    const result = await runAiForTranscript({
      mode,
      fullTranscript,
      question,
      useCase,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[ai]", err);
    return NextResponse.json(
      { error: err?.message || "AI request failed" },
      { status: 500 }
    );
  }
}
