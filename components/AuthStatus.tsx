"use client";

import { useEffect, useState } from "react";
import { ensureAnonymousUser, isSupabaseConfigured } from "@/lib/supabase";

// 홈 하단에 연결 상태를 작게 보여주는 확인용 표시 (데모 전에 지워도 됨)
export default function AuthStatus() {
  const [text, setText] = useState("연결 확인 중...");
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setText(".env.local에 Supabase 값이 아직 없어요");
      setOk(false);
      return;
    }
    ensureAnonymousUser()
      .then((u) => {
        setText(`연결됨 · 익명 사용자 ${u.id.slice(0, 8)}`);
        setOk(true);
      })
      .catch((e) => {
        setText(`연결 실패: ${e.message}`);
        setOk(false);
      });
  }, []);

  return (
    <p className={`text-center text-xs ${ok === false ? "text-red-500" : ok ? "text-sage-dark" : "text-foreground/40"}`}>
      {text}
    </p>
  );
}
