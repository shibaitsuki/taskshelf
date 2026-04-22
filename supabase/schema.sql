-- Taskshelf スキーマ
-- Supabase SQL Editorで実行してください

-- enumタイプを作成（既に存在する場合はスキップ）
do $$ begin
  create type task_priority as enum ('urgent', 'high', 'medium', 'low');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type task_status as enum ('todo', 'in_progress', 'done');
exception when duplicate_object then null;
end $$;

-- tasksテーブルを作成
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  priority task_priority not null default 'medium',
  status task_status not null default 'todo',
  parent_id uuid references tasks(id) on delete cascade,
  position integer not null default 0,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at を自動更新するトリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_updated_at on tasks;
create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- RLS有効化
alter table tasks enable row level security;

-- 全操作を許可するポリシー（個人利用向け）
drop policy if exists "allow all" on tasks;
create policy "allow all" on tasks for all using (true) with check (true);

-- インデックス
create index if not exists tasks_priority_position_idx on tasks(priority, position);
create index if not exists tasks_parent_id_idx on tasks(parent_id);
