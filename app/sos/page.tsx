import Link from "next/link";
import Header from "@/components/Header";

const contacts = [
  { name: "자살예방상담전화", number: "109", tel: "109" },
  { name: "정신건강위기상담", number: "1577-0199", tel: "15770199" },
  { name: "긴급 상황", number: "119", tel: "119" },
];

export default function SosPage() {
  return (
    <>
      <Header title="SOS" />
      <main className="flex flex-1 flex-col gap-4 px-5 py-4">
        <section className="rounded-3xl bg-butter/60 p-5">
          <h2 className="text-lg font-bold">지금 많이 힘들구나. 이야기해줘서 고마워.</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            혼자 견디지 않아도 돼. 아래 번호로 지금 바로 전화할 수 있어. 위급하면 119로 연락해줘.
          </p>
        </section>
        {contacts.map((c) => (
          <a
            key={c.tel}
            href={`tel:${c.tel}`}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
          >
            <div>
              <p className="text-sm text-foreground/60">{c.name}</p>
              <p className="text-xl font-bold">{c.number}</p>
            </div>
            <span className="rounded-full bg-sage px-4 py-2 text-sm font-semibold text-white">전화 걸기</span>
          </a>
        ))}
        <Link href="/" className="mt-auto py-3 text-center text-sm text-foreground/50 underline">
          홈으로 돌아가기
        </Link>
      </main>
    </>
  );
}
