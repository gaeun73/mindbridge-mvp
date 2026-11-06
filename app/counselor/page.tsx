"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { ensureAnonymousUser, getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatDate, type SavedReport } from "@/lib/types";

const RISK = {
  none: { label: "특이 위험 신호 없음", style: "bg-sage/30 text-[#3f5a42]" },
  low: { label: "주의 관찰 · 애매한 표현 있음", style: "bg-butter text-[#6b5a1a]" },
  high: { label: "위기 신호 감지 · 우선 확인 필요", style: "bg-red-100 text-red-700" },
} as const;

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-sage-dark">{title}</h3>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

// 읽기 전용 상담사 데모: 이 브라우저(같은 익명 사용자)의 가장 최근 리포트를 상담사 관점으로 정리해 보여준다.
export default function CounselorPage() {
  const [row, setRow] = useState<SavedReport | null | undefined>(undefined); // undefined=불러오는 중
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setFailed(true);
      return;
    }
    ensureAnonymousUser()
      .then(() =>
        getSupabase().from("reports").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      )
      .then(({ data, error }) => {
        if (error) throw error;
        setRow((data as SavedReport) ?? null);
      })
      .catch(() => setFailed(true));
  }, []);

  const r = row?.content;
  const topEmotion = r?.emotions.length ? [...r.emotions].sort((a, b) => b.intensity - a.intensity)[0] : null;

  return (
    <>
      <Header title="상담사 보기" />
      <main className="flex flex-1 flex-col gap-3 px-4 pb-6">
        <div className="flex items-center justify-between rounded-xl bg-black/5 px-3 py-2 text-xs text-foreground/60">
          <span>데모 · 읽기 전용</span>
          <span>이 브라우저의 최근 마음정리</span>
        </div>

        {failed && <p className="py-10 text-center text-sm text-red-600">불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>}
        {!failed && row === undefined && <p className="py-10 text-center text-sm text-foreground/50">불러오는 중...</p>}

        {!failed && row === null && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <p className="text-sm text-foreground/60">
              아직 저장된 마음정리가 없어요.
              <br />
              대화를 마치고 [저장하고 끝내기]를 누르면 여기에 나타나요.
            </p>
            <Link href="/chat" className="rounded-2xl bg-sage px-5 py-2.5 text-sm font-semibold text-white">
              고민 이야기하기
            </Link>
          </div>
        )}

        {r && row && (
          <>
            <section className="rounded-2xl bg-butter/60 p-4">
              <p className="text-xs text-foreground/60">{formatDate(row.created_at)} 자기점검 기록</p>
              <h2 className="mt-1 text-lg font-bold leading-snug">{r.title}</h2>
              <p className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${RISK[r.risk_level].style}`}>
                {RISK[r.risk_level].label}
              </p>
            </section>

            <Block title="주요 호소 (상황)">{r.situation || "-"}</Block>

            <Block title="정서 상태">
              {r.emotions.length === 0 ? (
                "-"
              ) : (
                <>
                  <ul className="flex flex-col gap-1.5">
                    {r.emotions.map((e) => (
                      <li key={e.name} className="flex items-center gap-3">
                        <span className="w-16 shrink-0">{e.name}</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                          <span
                            className="block h-full rounded-full bg-sage"
                            style={{ width: `${(e.intensity / 5) * 100}%` }}
                          />
                        </span>
                        <span className="w-8 text-right text-sm text-foreground/60">{e.intensity}/5</span>
                      </li>
                    ))}
                  </ul>
                  {topEmotion && (
                    <p className="mt-2 text-sm text-foreground/60">
                      가장 강하게 보고한 정서: {topEmotion.name} ({topEmotion.intensity}/5)
                    </p>
                  )}
                </>
              )}
            </Block>

            <Block title="인지 패턴">
              <p>
                <b>자동적 사고</b> · {r.automatic_thought || "-"}
              </p>
              {r.distortions.length === 0 ? (
                <p className="mt-2 text-sm text-foreground/60">뚜렷한 생각의 쏠림은 관찰되지 않았어요.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {r.distortions.map((d) => (
                    <li key={d.name} className="rounded-xl bg-background px-3 py-2">
                      <p className="font-semibold">{d.name}</p>
                      <p className="text-sm">{d.description}</p>
                      {d.evidence && <p className="mt-1 text-sm text-foreground/60">내담자 발화: {d.evidence}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Block>

            <Block title="내담자가 스스로 찾은 대안적 생각">{r.alternative_thought || "-"}</Block>

            <Block title="시도해 볼 작은 행동">{r.small_action || "-"}</Block>

            <p className="px-2 pt-2 text-center text-[11px] leading-relaxed text-foreground/50">
              이 화면은 AI가 생성한 자기점검 자료를 정리한 것이며 의학적 진단이 아닙니다.
              <br />
              시연용 화면으로, 로그인 없이 이 브라우저에 저장된 기록만 보여줍니다.
            </p>
          </>
        )}
      </main>
    </>
  );
}
