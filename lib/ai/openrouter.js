import { OPENROUTER_API_KEY, OPENROUTER_API_URL } from "./config";

export async function runOpenRouterChat({
  model,
  messages,
  prompt,
  temperature = 0.25,
  max_tokens = 1600,
  stop,
}) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required for the OpenRouter AI backend.");
  }

  if (!model) {
    throw new Error("OpenRouter model is required");
  }

  const requestMessages =
    messages ||
    [
      {
        role: "user",
        content: prompt || "",
      },
    ];

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Scriptly",
    },
    body: JSON.stringify({
      model,
      messages: requestMessages,
      temperature,
      max_tokens,
      response_format: { type: "json_object" },
      ...(stop ? { stop } : {}),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        `OpenRouter request failed with status ${response.status}`
    );
  }

  const choice = data?.choices?.[0];
  const content = (choice?.message?.content || "").trim();

  if (choice?.finish_reason === "length") {
    throw new Error("AI output was cut off before valid JSON could be completed.");
  }

  if (!content) {
    throw new Error("AI returned an empty response.");
  }

  return content;
}
