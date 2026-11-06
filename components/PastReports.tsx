"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ensureAnonymousUser, getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatDate } from "@/lib/types";

type Row = { id: string; title: string; created_at: string };

// 홈의 "지난 마음정리" 목록 (저장된 리포트를 최신순으로)
export default function PastReports() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setFailed(true);
      return;
    }
    ensureAnonymousUser()
      .then(() =>
        getSupabase().from("reports").select("id, title, created_at").order("created_at", { ascending: false }).limit(20),
      )
      .then(({ data, error }) => {
        if (error) throw error;
        setRows(data as Row[]);
      })
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="text-sm text-foreground/50">목록을 불러오지 못했어요.</p>;
  if (rows === null) return <p className="text-sm text-foreground/40">불러오는 중...</p>;
  if (rows.length === 0)
    return <p className="rounded-2xl bg-white p-4 text-sm text-foreground/50 shadow-sm">아직 저장된 마음정리가 없어요.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={`/result?id=${r.id}`} className="block rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-foreground/50">{formatDate(r.created_at)}</p>
            <p className="mt-1 font-medium">{r.title}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
