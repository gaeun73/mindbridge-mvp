import { NextResponse } from "next/server";
import { callOpenAIJson, loadPrompt } from "@/lib/openai";
import { ANALYSIS_MODEL } from "@/lib/config";
import type { Report } from "@/lib/types";

type Incoming = { role: "user" | "assistant"; content: string };

const ALLOWED_DISTORTIONS = [
  "흑백논리",
  "과잉일반화",
  "결핍 초점",
  "긍정 격하",
  "성급한 결론",
  "확대/축소 해석",
  "감정적 추론",
  "당위적 사고",
  "낙인찍기",
  "개인화",
];

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

// AI 응답이 약간 달라도 화면이 깨지지 않도록 모양을 정리한다
function normalize(raw: Record<string, unknown>): Report {
  const emotions = (Array.isArray(raw.emotions) ? raw.emotions : [])
    .map((e: any) => ({
      name: str(e?.name),
      intensity: Math.min(5, Math.max(1, Math.round(Number(e?.intensity) || 1))),
    }))
    .filter((e) => e.name)
    .slice(0, 5);

  const distortions = (Array.isArray(raw.distortions) ? raw.distortions : [])
    .map((d: any) => ({ name: str(d?.name), description: str(d?.description), evidence: str(d?.evidence) }))
    .filter((d) => d.name && ALLOWED_DISTORTIONS.some((a) => d.name.includes(a)))
    .slice(0, 3);

  const risk = raw.risk_level;
  return {
    title: str(raw.title) || "오늘의 마음정리",
    situation: str(raw.situation),
    emotions,
    automatic_thought: str(raw.automatic_thought),
    distortions,
    alternative_thought: str(raw.alternative_thought),
    small_action: str(raw.small_action),
    mindfulness: str(raw.mindfulness),
    risk_level: risk === "high" || risk === "low" ? risk : "none",
  };
}

export async function POST(req: Request) {
  let body: { messages?: Incoming[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const history = (body.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
  );
  if (!history.some((m) => m.role === "user")) {
    return NextResponse.json({ error: "분석할 대화가 없어요." }, { status: 400 });
  }

  const transcript = history.map((m) => `${m.role === "user" ? "사용자" : "AI"}: ${m.content}`).join("\n");

  try {
    const system = await loadPrompt("analysis");
    const raw = (await callOpenAIJson({
      model: ANALYSIS_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `[대화 기록]\n${transcript}` },
      ],
    })) as Record<string, unknown>;

    return NextResponse.json({ report: normalize(raw) });
  } catch (e) {
    console.error("[/api/analyze]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "분석을 만들지 못했어요. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }
}
