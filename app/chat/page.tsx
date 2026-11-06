"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { ensureAnonymousUser, getSupabase } from "@/lib/supabase";

type Msg = { role: "assistant" | "user"; text: string };

const GREETING = "안녕, 와줘서 고마워. 오늘 어떤 일이 마음에 걸렸어?";
const CONV_KEY = "mb_conversation_id";

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false); // risk_level "low"일 때 안내 배너
  const convIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasUserMessage = messages.some((m) => m.role === "user");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 새 대화가 시작될 때 이전 대화 id는 지운다
  useEffect(() => {
    try {
      sessionStorage.removeItem(CONV_KEY);
    } catch {}
  }, []);

  async function getConversationId() {
    if (convIdRef.current) return convIdRef.current;
    await ensureAnonymousUser();
    const { data, error } = await getSupabase().from("conversations").insert({}).select("id").single();
    if (error) throw error;
    convIdRef.current = data.id;
    try {
      sessionStorage.setItem(CONV_KEY, data.id);
    } catch {}
    return data.id as string;
  }

  async function saveMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
    extra?: { stage: number; risk_level: string },
  ) {
    const { error } = await getSupabase()
      .from("messages")
      .insert({ conversation_id: conversationId, role, content, ...extra });
    if (error) console.error("메시지 저장 실패", error.message);
  }

  // AI에게 답을 받아 화면에 붙이고 저장한다. isContinue=true면 AI가 먼저 다음 질문을 던진다.
  async function askAi(history: Msg[], isContinue: boolean) {
    const conversationId = await getConversationId();
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // 첫 인사말은 AI가 한 말이 아니라 화면용 문구라 제외
        messages: history.slice(1).map((m) => ({ role: m.role, content: m.text })),
        continue: isContinue,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "AI 응답 오류");

    setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
    await saveMessage(conversationId, "assistant", data.reply, {
      stage: data.stage,
      risk_level: data.risk_level,
    });

    if (data.risk_level === "high") {
      // 분명한 위기 신호: 답을 잠깐 보여준 뒤 SOS 화면으로
      setTimeout(() => router.push("/sos"), 1200);
    } else if (data.risk_level === "low") {
      setShowBanner(true);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    setLoading(true);

    const next: Msg[] = [...messages, { role: "user", text }];
    setMessages(next);
    try {
      const conversationId = await getConversationId();
      await saveMessage(conversationId, "user", text);
      await askAi(next, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "문제가 생겼어요. 다시 시도해 주세요.");
      // 보낸 말은 입력창에 되돌려 다시 보낼 수 있게 한다
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  // [조금 더 대화하기]: 사용자가 막혔을 때 AI가 먼저 다음 질문을 던진다
  async function continueTalk() {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      await askAi(messages, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "문제가 생겼어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header title="마음 대화" sos />

      {showBanner && (
        <div className="mx-4 mb-2 flex items-start justify-between gap-2 rounded-2xl bg-butter/70 px-4 py-3 text-sm">
          <p className="leading-relaxed">
            마음이 많이 힘들면 혼자 견디지 않아도 돼.{" "}
            <a href="tel:109" className="font-semibold underline">
              109
            </a>
            {" · "}
            <a href="tel:15770199" className="font-semibold underline">
              1577-0199
            </a>
          </p>
          <button onClick={() => setShowBanner(false)} aria-label="안내 닫기" className="px-1 text-foreground/50">
            ✕
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                m.role === "assistant" ? "self-start bg-white shadow-sm" : "self-end bg-sage text-white"
              }`}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="self-start rounded-2xl bg-white px-4 py-2.5 text-foreground/40 shadow-sm">...</div>
          )}
          {error && (
            <div className="self-center rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">{error}</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-black/5 bg-background p-3">
        <div className="mb-3 flex gap-2">
          <button
            onClick={continueTalk}
            disabled={loading}
            className="flex-1 rounded-2xl bg-white py-2.5 text-sm font-medium shadow-sm disabled:opacity-50"
          >
            조금 더 대화하기
          </button>
          <button
            onClick={() => router.push("/result")}
            disabled={!hasUserMessage || loading}
            className="flex-1 rounded-2xl bg-butter py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            대화 요약하기
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && send()}
            placeholder="마음을 편하게 적어줘"
            disabled={loading}
            className="flex-1 rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-[15px] outline-none focus:border-sage disabled:opacity-60"
          />
          <button
            onClick={send}
            disabled={loading}
            className="rounded-2xl bg-sage px-4 font-semibold text-white disabled:opacity-60"
          >
            보내기
          </button>
        </div>
      </div>
    </>
  );
}
