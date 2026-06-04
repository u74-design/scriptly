import { AI_BACKEND, getModelForUseCase } from "./ai/config";
import { runOllamaChat } from "./ai/ollama";
import { runOpenRouterChat } from "./ai/openrouter";

export function cleanJsonResponse(text) {
  return (text || "")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

export function parseJsonResponse(text) {
  const cleaned = cleanJsonResponse(text);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }

    throw new Error(`AI returned invalid JSON. ${err.message}`);
  }
}

function shouldRetryJsonError(err) {
  const message = err?.message || "";
  return (
    message.includes("AI returned invalid JSON") ||
    message.includes("AI output was cut off") ||
    message.includes("Unterminated string") ||
    message.includes("Unexpected end")
  );
}

function buildJsonRetryInput({ messages, prompt }) {
  const retryInstruction =
    "Your previous response failed because it was not complete valid JSON. " +
    "Regenerate the response as exactly one complete valid JSON object. " +
    "Do not use markdown. Do not include comments. Close every string, array, and object. " +
    "Keep the response shorter than before. Reduce item count and detail enough to keep the JSON valid.";

  if (messages) {
    return {
      messages: [
        {
          role: "system",
          content: retryInstruction,
        },
        ...messages,
      ],
      prompt,
    };
  }

  return {
    messages,
    prompt: `${prompt || ""}\n\n${retryInstruction}`,
  };
}

export async function runAi({
  messages,
  prompt,
  temperature = 0.25,
  useCase = "default",
  model,
  max_tokens = 1600,
  stop,
}) {
  const resolvedModel = model || getModelForUseCase(useCase);
  const backend = AI_BACKEND.toLowerCase();

  const runner = backend === "openrouter" ? runOpenRouterChat : runOllamaChat;

  return runner({
    model: resolvedModel,
    messages,
    prompt,
    temperature,
    max_tokens,
    stop,
  });
}

export async function runAiJson({
  messages,
  prompt,
  temperature = 0.25,
  useCase = "default",
  model,
  max_tokens,
}) {
  let lastError;
  let currentMessages = messages;
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const text = await runAi({
        messages: currentMessages,
        prompt: currentPrompt,
        temperature: attempt === 1 ? temperature : Math.min(temperature, 0.15),
        useCase,
        model,
        max_tokens: attempt === 1 ? max_tokens : Math.min(max_tokens || 1600, 1200),
      });

      return parseJsonResponse(text);
    } catch (err) {
      lastError = err;

      if (attempt === 2 || !shouldRetryJsonError(err)) {
        break;
      }

      const retryInput = buildJsonRetryInput({
        messages: currentMessages,
        prompt: currentPrompt,
      });
      currentMessages = retryInput.messages;
      currentPrompt = retryInput.prompt;
    }
  }

  throw lastError;
}
