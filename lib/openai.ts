import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function loadPrompt(name: "chat" | "analysis") {
  return readFile(path.join(process.cwd(), "prompts", `${name}.md`), "utf-8");
}

// OpenAI를 JSON 모드로 호출하고, 파싱된 JSON 객체를 돌려줍니다. (서버에서만 실행됨)
export async function callOpenAIJson(opts: {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
}): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY가 .env.local에 없어요.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: opts.temperature,
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI 오류 ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  return JSON.parse(text);
}
