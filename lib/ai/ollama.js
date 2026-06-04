import { OLLAMA_API_URL } from "./config";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export async function runOllamaChat({
  model,
  messages,
  prompt,
  temperature = 0.25,
  max_tokens = 1600,
  top_p = 0.95,
  stop,
}) {
  if (!model) {
    throw new Error("Ollama model is required");
  }

  const body = {
    model,
    stream: false,
    format: "json",
    options: {
      temperature,
      num_predict: max_tokens,
      top_p,
    },
  };

  if (stop) {
    body.stop = stop;
  }

  if (messages) {
    body.messages = messages;
  }

  if (prompt) {
    body.messages = [{ role: "user", content: prompt }];
  }

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(OLLAMA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || `Ollama request failed with status ${response.status}`
        );
      }

      if (Array.isArray(data.results)) {
        return data.results
          .map((result) => result.output || result.content || "")
          .join("\n")
          .trim();
      }
      return (
        data.message?.content ||
        data.response ||
        data.output ||
        data.content ||
        ""
      ).trim();
    } catch (err) {
      lastError = err;
      const message = err?.message || String(err);

      if (attempt === MAX_RETRIES) {
        throw new Error(
          `Ollama request failed after ${MAX_RETRIES} attempts. ` +
            `Check that Ollama is running at ${OLLAMA_API_URL} and the model is available. ` +
            message
        );
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw lastError;
}
