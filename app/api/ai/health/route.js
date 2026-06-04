import { NextResponse } from "next/server";
import {
  AI_BACKEND,
  OLLAMA_API_MODELS_URL,
  OPENROUTER_API_KEY,
} from "@/lib/ai/config";

export async function GET() {
  if (AI_BACKEND.toLowerCase() === "openrouter") {
    return NextResponse.json({
      ok: Boolean(OPENROUTER_API_KEY),
      backend: "openrouter",
      error: OPENROUTER_API_KEY ? undefined : "OPENROUTER_API_KEY is missing.",
    });
  }

  try {
    const response = await fetch(OLLAMA_API_MODELS_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: "Ollama models endpoint returned an error.",
        },
        { status: 502 }
      );
    }

    const models = await response.json();
    return NextResponse.json({ ok: true, backend: "ollama", models });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unable to reach Ollama.",
      },
      { status: 502 }
    );
  }
}
