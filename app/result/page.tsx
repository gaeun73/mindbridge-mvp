"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import ReportView from "@/components/ReportView";
import PrintSheet, { type TranscriptMsg } from "@/components/PrintSheet";
import { ensureAnonymousUser, getSupabase } from "@/lib/supabase";
import { formatDate, type Report, type SavedReport } from "@/lib/types";

const CONV_KEY = "mb_conversation_id";

type State =
  | { kind: "loading"; text: string }
  | { kind: "error"; text: string; canRetry: boolean }
  | { kind: "ready"; report: Report; date: string; saved: boolean };

function ResultInner() {
  const router = useRouter();
  const savedId = useSearchParams().get("id"); // 있으면 "지난 마음정리" 보기
  const [state, setState] = useState<State>({ kind: "loading", text: "불러오는 중이에요..." });
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);

  // PDF 내보내기
  const [exportOpen, setExportOpen] = useState(false);
  const [withTranscript, setWithTranscript] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMsg[] | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState(false);

  async function toggleTranscript(checked: boolean) {
    setWithTranscript(checked);
    if (!checked || transcript || !convId) return;
    setTranscriptLoading(true);
    setTranscriptError(false);
    try {
      await ensureAnonymousUser();
      const { data, error } = await getSupabase()
        .from("messages")
        .select("role, content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setTranscript(data as TranscriptMsg[]);
    } catch {
      setTranscriptError(true);
      setWithTranscript(false);
    } finally {
      setTranscriptLoading(false);
    }
  }

  function printPdf() {
    if (state.kind !== "ready") return;
    // 저장되는 PDF 파일 이름이 되도록 잠깐 제목을 바꾼다
    const prev = document.title;
    document.title = `나의 마음정리_${state.date}`;
    const restore = () => {
      document.title = prev;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  useEffect(() => {
    let cancelled = false;
    const set = (s: State) => !cancelled && setState(s);

    async function loadSaved(id: string) {
      await ensureAnonymousUser();
      const { data, error } = await getSupabase().from("reports").select("*").eq("id", id).maybeSingle();
      if (error || !data) return set({ kind: "error", text: "마음정리를 찾을 수 없어요.", canRetry: false });
      const row = data as SavedReport;
      if (!cancelled) setConvId(row.conversation_id);
      set({ kind: "ready", report: row.content, date: formatDate(row.created_at), saved: true });
    }

    async function analyzeNew() {
      let cid: string | null = null;
      try {
        cid = sessionStorage.getItem(CONV_KEY);
      } catch {}
      if (!cid) return set({ kind: "error", text: "분석할 대화가 없어요. 먼저 이야기를 나눠 주세요.", canRetry: false });
      setConvId(cid);

      // 새로고침해도 다시 분석하지 않도록 결과를 임시로 보관
      try {
        const cached = sessionStorage.getItem(`mb_analysis_${cid}`);
        if (cached) {
          const c = JSON.parse(cached) as { report: Report; date: string; saved: boolean };
          return set({ kind: "ready", ...c });
        }
      } catch {}

      set({ kind: "loading", text: "대화를 차분히 살펴보고 있어요..." });
      await ensureAnonymousUser();
      const { data: msgs, error } = await getSupabase()
        .from("messages")
        .select("role, content")
        .eq("conversation_id", cid)
        .order("created_at", { ascending: true });
      if (error) throw error;
      if (!msgs || !msgs.some((m) => m.role === "user")) {
        return set({ kind: "error", text: "분석할 대화가 없어요. 먼저 이야기를 나눠 주세요.", canRetry: false });
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "분석 오류");

      const ready = { report: data.report as Report, date: formatDate(), saved: false };
      try {
        sessionStorage.setItem(`mb_analysis_${cid}`, JSON.stringify(ready));
      } catch {}
      set({ kind: "ready", ...ready });
    }

    (savedId ? loadSaved(savedId) : analyzeNew()).catch((e) =>
      set({ kind: "error", text: e instanceof Error ? e.message : "문제가 생겼어요.", canRetry: true }),
    );
    return () => {
      cancelled = true;
    };
  }, [savedId, attempt]);

  async function saveAndFinish() {
    if (state.kind !== "ready" || saving) return;
    if (state.saved || !convId) return router.push("/");
    setSaving(true);
    try {
      await ensureAnonymousUser();
      const { error } = await getSupabase().from("reports").insert({
        conversation_id: convId,
        title: state.report.title,
        content: state.report,
        risk_level: state.report.risk_level,
      });
      if (error) throw error;
      try {
        sessionStorage.removeItem(`mb_analysis_${convId}`);
        sessionStorage.removeItem(CONV_KEY);
      } catch {}
      router.push("/");
    } catch (e) {
      setState({ kind: "error", text: `저장하지 못했어요: ${e instanceof Error ? e.message : ""}`, canRetry: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {state.kind === "ready" && (
        <PrintSheet report={state.report} date={state.date} transcript={withTranscript ? transcript : null} />
      )}
      <div className="contents print:hidden">
      <Header title={savedId ? "지난 마음정리" : "오늘의 마음정리"} />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        {state.kind === "loading" && (
          <div className="flex flex-1 items-center justify-center text-sm text-foreground/60">{state.text}</div>
        )}

        {state.kind === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-red-600">{state.text}</p>
            {state.canRetry ? (
              <button
                onClick={() => {
                  setState({ kind: "loading", text: "다시 시도하는 중이에요..." });
                  setAttempt((a) => a + 1);
                }}
                className="rounded-2xl bg-sage px-5 py-2.5 text-sm font-semibold text-white"
              >
                다시 시도
              </button>
            ) : (
              <Link href="/chat" className="rounded-2xl bg-sage px-5 py-2.5 text-sm font-semibold text-white">
                대화하러 가기
              </Link>
            )}
          </div>
        )}

        {state.kind === "ready" && (
          <>
            <ReportView report={state.report} date={state.date} />
            <div className="mt-auto flex gap-2 pt-2">
              <button
                onClick={() => setExportOpen(true)}
                className="flex-1 rounded-2xl bg-white py-3 text-sm font-medium shadow-sm"
              >
                PDF로 내보내기
              </button>
              <button
                onClick={saveAndFinish}
                disabled={saving}
                className="flex-1 rounded-2xl bg-sage py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {state.saved ? "홈으로" : saving ? "저장 중..." : "저장하고 끝내기"}
              </button>
            </div>
          </>
        )}
      </main>

      {exportOpen && (
        <div
          className="fixed inset-0 z-10 flex items-end justify-center bg-black/30"
          onClick={() => setExportOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-3xl bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold">PDF로 내보내기</h3>
            <p className="mt-1 text-sm text-foreground/60">
              인쇄 창이 열리면 대상(프린터)을 <b>PDF로 저장</b>으로 선택해 주세요.
            </p>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={withTranscript}
                onChange={(e) => toggleTranscript(e.target.checked)}
                className="h-4 w-4 accent-[#6f8f72]"
              />
              대화 원문도 포함하기
              {transcriptLoading && <span className="text-foreground/40">(불러오는 중...)</span>}
            </label>
            {transcriptError && <p className="mt-1 text-xs text-red-600">대화 원문을 불러오지 못했어요.</p>}
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setExportOpen(false)}
                className="flex-1 rounded-2xl bg-black/5 py-3 text-sm font-medium"
              >
                닫기
              </button>
              <button
                onClick={printPdf}
                disabled={transcriptLoading}
                className="flex-1 rounded-2xl bg-sage py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                PDF로 저장
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={null}>
      <ResultInner />
    </Suspense>
  );
}
