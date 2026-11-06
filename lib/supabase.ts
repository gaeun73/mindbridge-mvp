import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// 브라우저에서 쓰는 Supabase 클라이언트 (하나만 만들어 재사용)
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return client;
}

// 익명 로그인: 이미 세션이 있으면 그대로 쓰고, 없으면 새로 만든다.
// 홈 화면처럼 여러 곳에서 동시에 부르면 로그인 요청이 여러 번 나가 한도(시간당 IP별 횟수)가
// 빨리 닳으므로, 진행 중인 요청 하나를 같이 기다리게 한다.
let pending: ReturnType<typeof signInOrReuse> | null = null;

async function signInOrReuse() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user;
  const { data: signIn, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signIn.user!;
}

export function ensureAnonymousUser() {
  if (!pending) {
    pending = signInOrReuse().finally(() => {
      pending = null;
    });
  }
  return pending;
}
