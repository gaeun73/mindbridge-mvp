import Link from "next/link";

export default function Header({
  title,
  back = true,
  sos = false,
}: {
  title: string;
  back?: boolean;
  sos?: boolean;
}) {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <div className="flex w-16 items-center">
        {back && (
          <Link href="/" className="rounded-full px-2 py-1 text-sm text-sage-dark">
            ← 홈
          </Link>
        )}
      </div>
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="flex w-16 justify-end">
        {sos && (
          <Link href="/sos" className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-600">
            SOS
          </Link>
        )}
      </div>
    </header>
  );
}
