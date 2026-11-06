"use client";

import { useState } from "react";
import type { Report } from "@/lib/types";

const tabs = ["전체 보기", "논리적 분석", "공감적 위로"] as const;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-sage-dark">{title}</h3>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}

// 리포트 본문 (제목·탭·카드). 결과 화면에서 사용
export default function ReportView({ report: r, date }: { report: Report; date: string }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("전체 보기");
  const showLogic = tab !== "공감적 위로";
  const showComfort = tab !== "논리적 분석";

  return (
    <>
      <div>
        <p className="text-xs text-foreground/50">{date}</p>
        <h2 className="mt-1 text-xl font-bold">{r.title}</h2>
      </div>

      <div className="flex gap-1 rounded-2xl bg-black/5 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm ${
              tab === t ? "bg-white font-semibold shadow-sm" : "text-foreground/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {showLogic && (
        <>
          <Card title="상황">{r.situation || "-"}</Card>
          <Card title="감정과 강도">
            {r.emotions.length === 0 ? (
              "-"
            ) : (
              <ul className="flex flex-col gap-1">
                {r.emotions.map((e) => (
                  <li key={e.name} className="flex justify-between">
                    <span>{e.name}</span>
                    <span className="text-sage-dark">
                      {"●".repeat(e.intensity)}
                      {"○".repeat(5 - e.intensity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="자동적 사고">{r.automatic_thought || "-"}</Card>
          {r.distortions.length === 0 ? (
            <Card title="인지 왜곡">이번 대화에서는 뚜렷하게 보이는 생각의 쏠림이 없었어요.</Card>
          ) : (
            r.distortions.map((d) => (
              <Card key={d.name} title={`인지 왜곡 · ${d.name}`}>
                <p>{d.description}</p>
                {d.evidence && <p className="mt-2 rounded-xl bg-butter/50 px-3 py-2 text-sm">근거: {d.evidence}</p>}
              </Card>
            ))
          )}
          <Card title="대안적 생각">{r.alternative_thought || "-"}</Card>
        </>
      )}

      {showComfort && (
        <>
          <section className="rounded-2xl bg-butter/60 p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground/70">마음 챙김</h3>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{r.mindfulness || "-"}</p>
          </section>
          <Card title="작은 행동">{r.small_action || "-"}</Card>
        </>
      )}

      <p className="px-2 text-center text-xs leading-relaxed text-foreground/50">
        이 리포트는 AI가 생성한 자기점검 자료이며 의학적 진단이 아닙니다. 많이 힘들 땐 109 · 1577-0199 · 119로 연락해
        주세요.
      </p>
    </>
  );
}
