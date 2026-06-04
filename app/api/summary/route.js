// app/api/summary/route.js

import { NextResponse } from "next/server";
import { runAiJson } from "@/lib/ai";

const DIRECT_TRANSCRIPT_LIMIT = 20000;
const CHUNK_SIZE = 9000;
const MAX_CHUNKS = 6;

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

function buildSummaryPrompt(transcript) {
  return `
You are a JSON generator.

Analyze this YouTube transcript and return ONLY valid JSON.

Rules:
- Return ONLY JSON
- No markdown
- No explanation
- No \`\`\`
- Must be valid JSON.parse format

Transcript:
${transcript.slice(0, DIRECT_TRANSCRIPT_LIMIT)}

Create a useful summary for a learner. Explain the main ideas, include important details,
and keep the JSON compact enough to complete correctly.

Return exactly this structure:

{
  "timestamps": [
    {
      "timestamp": "MM:SS",
      "heading": "Short title",
      "description": "1-2 sentence useful summary"
    }
  ],
  "keyPoints": [
    "detailed sentence with context"
  ],
  "overview": "detailed 2-4 paragraph overview"
}

Quantity target:
- keyPoints: 7-10 useful points when available
- timestamps: 5-8 important moments when available
`;
}

async function generateSummary(fullTranscript) {
  const chunks = splitTranscriptIntoChunks(fullTranscript);

  if (chunks.length <= 1 && fullTranscript.length <= DIRECT_TRANSCRIPT_LIMIT) {
    return runAiJson({
      prompt: buildSummaryPrompt(fullTranscript),
      temperature: 0.3,
      useCase: "summary",
      max_tokens: 2200,
    });
  }

  const chunkResults = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const result = await runAiJson({
      prompt: buildSummaryPrompt(`Part ${index + 1} of ${chunks.length}\n\n${chunks[index]}`),
      temperature: 0.3,
      useCase: "summary",
      max_tokens: 1200,
    });

    chunkResults.push(result);
  }

  return {
    timestamps: chunkResults.flatMap((item) => item.timestamps || []).slice(0, 14),
    keyPoints: uniqueStrings(chunkResults.map((item) => item.keyPoints || []), 16),
    overview: chunkResults.map((item) => item.overview).filter(Boolean).join("\n\n"),
  };
}

export async function POST(request) {
  try {
    const { fullTranscript } = await request.json();

    if (!fullTranscript) {
      return NextResponse.json(
        { error: "Transcript required" },
        { status: 400 }
      );
    }

    const result = await generateSummary(fullTranscript);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[summary]", err);

    return NextResponse.json(
      {
        error:
          err?.message || "Summary generation failed",
      },
      { status: 500 }
    );
  }
}
