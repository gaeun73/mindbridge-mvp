import type { Report } from "@/lib/types";

export type TranscriptMsg = { role: "user" | "assistant"; content: string };

export const DISCLAIMER = "이 리포트는 AI가 생성한 자기점검 자료이며 의학적 진단이 아닙니다.";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-1.5 border-l-4 border-[#9db89f] pl-2 text-[13px] font-bold text-[#4f6b52]">{title}</h3>
      <div className="text-[13px] leading-relaxed text-black">{children}</div>
    </section>
  );
}

// 화면에서는 숨겨져 있고, 인쇄(PDF 저장)할 때만 보이는 레이아웃
export default function PrintSheet({
  report: r,
  date,
  transcript,
  forceVisible = false,
}: {
  report: Report;
  date: string;
  transcript: TranscriptMsg[] | null; // null이면 대화 원문 제외
  forceVisible?: boolean; // 미리보기/테스트용
}) {
  return (
    <div className={`${forceVisible ? "block" : "hidden print:block"} bg-white p-2 text-black`}>
      <header className="mb-5 border-b-2 border-[#9db89f] pb-3">
        <h1 className="text-2xl font-bold">나의 마음정리</h1>
        <p className="mt-1 text-[12px] text-gray-600">{date}</p>
        <p className="mt-2 text-[15px] font-semibold">{r.title}</p>
      </header>

      <div className="flex flex-col gap-4">
        <Section title="상황">{r.situation || "-"}</Section>

        <Section title="감정과 강도">
          {r.emotions.length === 0 ? (
            "-"
          ) : (
            <ul>
              {r.emotions.map((e) => (
                <li key={e.name}>
                  {e.name} — {e.intensity} / 5
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="생각 패턴">
          <p>
            <b>자동적 사고:</b> {r.automatic_thought || "-"}
          </p>
          {r.distortions.length > 0 && (
            <ul className="mt-2 flex flex-col gap-2">
              {r.distortions.map((d) => (
                <li key={d.name} className="break-inside-avoid rounded border border-gray-300 px-3 py-2">
                  <p className="font-semibold">{d.name}</p>
                  <p>{d.description}</p>
                  {d.evidence && <p className="text-gray-600">근거: {d.evidence}</p>}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="대안적 생각">{r.alternative_thought || "-"}</Section>

        <Section title="마음 챙김">
          <p className="whitespace-pre-wrap">{r.mindfulness || "-"}</p>
          {r.small_action && (
            <p className="mt-2">
              <b>작은 행동:</b> {r.small_action}
            </p>
          )}
        </Section>

        {transcript && (
          <Section title="대화 원문">
            <ul className="flex flex-col gap-1.5">
              {transcript.map((m, i) => (
                <li key={i} className="break-inside-avoid">
                  <b>{m.role === "user" ? "나" : "AI"}:</b> <span className="whitespace-pre-wrap">{m.content}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      <footer className="mt-8 border-t border-gray-300 pt-3 text-center text-[11px] text-gray-500">{DISCLAIMER}</footer>
    </div>
  );
}
