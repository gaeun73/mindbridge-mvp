import { NextResponse } from "next/server";
import { callOpenAIJson, loadPrompt, type ChatMessage } from "@/lib/openai";
import { CHAT_MODEL } from "@/lib/config";

// 분명한 위기 표현만 "high" (관용 표현 "~죽겠다", "~죽는다"는 걸리지 않음)
const HIGH_PATTERN =
  /죽고\s*싶|죽어\s*버리고\s*싶|자살|자해|사라지고\s*싶|사라져\s*버리고\s*싶|(삶|인생|목숨|생)을?\s*(끝내|마감|포기)|스스로\s*(를\s*)?(해치|죽)/;
// 애매한 표현은 "low" (대화는 계속, 안내 배너만)
const LOW_PATTERN = /살기\s*싫|살고\s*싶지\s*않|살아갈\s*자신|다\s*의미\s*없|없어졌으면|사라졌으면/;

// AI가 이어서 말할 때(조금 더 대화하기) 추가로 보내는 지시
const CONTINUE_INSTRUCTION =
  "[시스템 안내] 사용자가 다음에 무슨 말을 해야 할지 막혀서 도움을 요청했어. " +
  "지금까지의 대화를 이어받아, 현재 단계에 맞는 다음 질문을 네가 먼저 던져줘. 질문은 1개만. " +
  "대화가 아직 시작되지 않았다면 가볍게 인사하고 무슨 일이 있었는지 물어봐.";

const CRISIS_REPLY =
  "이야기해줘서 정말 고마워. 지금 마음이 많이 힘들다는 게 느껴져. 지금 안전한 곳에 있는지 먼저 알려줄래? 혼자 견디지 않아도 돼. 109(자살예방상담전화)나 1577-0199에 지금 바로 전화할 수 있고, 위급하면 119에 연락해줘.";

type Incoming ={ role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let body: { messages?: Incoming[]; continue?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const history = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-30);
  const isContinue = body.continue === true;
  if (history.length === 0 && !isContinue) {
    return NextResponse.json({ error: "메시지가 없어요." }, { status: 400 });
  }

  try {
    const system = await loadPrompt("chat");
    const messages: ChatMessage[] = [
      { role: "system", content: system },
      ...history,
      ...(isContinue ? [{ role: "system" as const, content: CONTINUE_INSTRUCTION }] : []),
    ];
    const raw = (await callOpenAIJson({ model: CHAT_MODEL, messages, temperature: 0.7 })) as {
      reply?: unknown;
      stage?: unknown;
      risk_level?: unknown;
    };

    const reply = typeof raw.reply === "string" && raw.reply.trim() ? raw.reply.trim() : null;
    if (!reply) throw new Error("AI 응답에 reply가 없어요.");
    const stage = Math.min(6, Math.max(1, Math.round(Number(raw.stage) || 1)));
    let risk_level: "none" | "low" | "high" =
      raw.risk_level === "high" || raw.risk_level === "low" ? raw.risk_level : "none";

    // 안전장치: 이어가기 요청이 아닐 때, 마지막 사용자 말에 분명한 위기 표현이 있으면 AI가 놓쳤어도 high로
    const lastUser = isContinue ? "" : ([...history].reverse().find((m) => m.role === "user")?.content ?? "");
    if (risk_level !== "high" && HIGH_PATTERN.test(lastUser)) {
      return NextResponse.json({ reply: CRISIS_REPLY, stage: 1, risk_level: "high" });
    }
    // 애매한 표현이면 low로 올림 (대화는 계속, 배너만)
    if (risk_level === "none" && LOW_PATTERN.test(lastUser)) risk_level = "low";

    return NextResponse.json({ reply, stage, risk_level });
  } catch (e) {
    console.error("[/api/chat]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "AI 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
