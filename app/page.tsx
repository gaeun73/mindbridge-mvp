import Image from "next/image";
import Link from "next/link";
import PastReports from "@/components/PastReports";
import AuthStatus from "@/components/AuthStatus";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-5 py-8">
      <div className="relative h-44 overflow-hidden rounded-3xl shadow-sm">
        <Image
          src="/assets/hero.png"
          alt="창가에 놓인 화분과 아침 햇살"
          fill
          priority
          sizes="(max-width: 430px) 100vw, 430px"
          className="object-cover object-[50%_60%]"
        />
      </div>

      <section className="rounded-3xl bg-butter/60 p-6">
        <p className="text-sm text-foreground/60">MindBridge</p>
        <h1 className="mt-2 text-2xl font-bold leading-snug">안녕, 오늘 마음은 어때?</h1>
        <p className="mt-2 text-sm text-foreground/70">편하게 이야기하면 함께 정리해 줄게.</p>
        <Link
          href="/chat"
          className="mt-5 block rounded-2xl bg-sage py-3.5 text-center font-semibold text-white shadow-sm"
        >
          고민 이야기하기
        </Link>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground/70">지난 마음정리</h2>
        <PastReports />
      </section>

      <p className="mt-auto rounded-2xl bg-black/5 px-4 py-3 text-xs leading-relaxed text-foreground/60">
        MindBridge는 AI가 도와주는 자기점검 도구이며 의학적 진단·치료가 아니에요. 대화와 마음정리는 회원가입 없이
        이 브라우저의 익명 계정으로 저장돼요. 많이 힘들 땐 109 · 1577-0199 · 119로 연락해 주세요.
      </p>

      <div className="flex flex-col gap-2">
        <Link href="/sos" className="text-center text-sm text-foreground/50 underline">
          도움이 필요해요 (SOS)
        </Link>
        <Link href="/counselor" className="text-center text-xs text-foreground/40 underline">
          상담사 보기 (데모)
        </Link>
        <AuthStatus />
      </div>
    </main>
  );
}
