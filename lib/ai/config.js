export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY?.trim();
export const OPENROUTER_API_URL =
  process.env.OPENROUTER_API_URL?.trim() ||
  "https://openrouter.ai/api/v1/chat/completions";

export const AI_BACKEND =
  process.env.AI_BACKEND?.trim() || (OPENROUTER_API_KEY ? "openrouter" : "ollama");

export const OLLAMA_API_URL =
  process.env.OLLAMA_API_URL?.trim() ||
  "http://127.0.0.1:11434/api/chat";
export const OLLAMA_API_MODELS_URL = new URL("/api/tags", OLLAMA_API_URL).toString();

export const MODELS = {
  SUMMARY_MODEL:
    process.env.SUMMARY_MODEL?.trim() ||
    process.env.AI_MODEL?.trim() ||
    (AI_BACKEND === "openrouter" ? "meta-llama/llama-3.1-8b-instruct" : "llama3.1:8b"),
  QA_MODEL:
    process.env.QA_MODEL?.trim() ||
    process.env.AI_MODEL?.trim() ||
    (AI_BACKEND === "openrouter" ? "meta-llama/llama-3.1-8b-instruct" : "llama3.1:8b"),
  ASSISTANT_MODEL:
    process.env.ASSISTANT_MODEL?.trim() ||
    process.env.AI_MODEL?.trim() ||
    (AI_BACKEND === "openrouter" ? "meta-llama/llama-3.1-8b-instruct" : "llama3.1:8b"),
  DEFAULT_MODEL:
    process.env.DEFAULT_MODEL?.trim() ||
    process.env.AI_MODEL?.trim() ||
    (AI_BACKEND === "openrouter" ? "meta-llama/llama-3.1-8b-instruct" : "llama3.1:8b"),
  FAST_MODEL:
    process.env.FAST_MODEL?.trim() ||
    (AI_BACKEND === "openrouter" ? "meta-llama/llama-3.1-8b-instruct" : "mistral:7b"),
};

export const MODEL_MAP = {
  summary: MODELS.SUMMARY_MODEL,
  notes: MODELS.SUMMARY_MODEL,
  study: MODELS.SUMMARY_MODEL,
  ask: MODELS.QA_MODEL,
  qa: MODELS.QA_MODEL,
  explain: MODELS.SUMMARY_MODEL,
  assistant: MODELS.ASSISTANT_MODEL,
  default: MODELS.DEFAULT_MODEL,
  fast: MODELS.FAST_MODEL,
};

export function getModelForUseCase(useCase = "default") {
  return MODEL_MAP[useCase] || MODELS.DEFAULT_MODEL;
}
