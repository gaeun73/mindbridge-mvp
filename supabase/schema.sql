-- MindBridge MVP 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 Run 하세요. (여러 번 실행해도 안전)

-- 1) 대화
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2) 메시지
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  stage int,
  risk_level text check (risk_level in ('none', 'low', 'high')),
  created_at timestamptz not null default now()
);

-- 3) 리포트 (마음정리)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  content jsonb not null,
  risk_level text check (risk_level in ('none', 'low', 'high')),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists reports_user_idx on public.reports (user_id, created_at desc);

-- 4) RLS: 본인 데이터만 접근
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;

drop policy if exists "own conversations" on public.conversations;
create policy "own conversations" on public.conversations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "own messages" on public.messages;
create policy "own messages" on public.messages
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

drop policy if exists "own reports" on public.reports;
create policy "own reports" on public.reports
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

-- (참고) /counselor 데모용 읽기 정책은 6단계에서 따로 추가합니다.
