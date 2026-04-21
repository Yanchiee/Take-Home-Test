create type session_status as enum ('in_progress', 'submitted', 'reopened');
create type event_type as enum (
  'session_start',
  'session_resume',
  'idle_start',
  'idle_end',
  'tab_hidden',
  'tab_visible',
  'tab_closed',
  'paste_detected',
  'multi_tab_detected',
  'submit',
  'admin_reopen',
  'links_updated'
);

create table candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  resume_token text not null unique,
  created_at timestamptz not null default now()
);
create index candidates_resume_token_idx on candidates(resume_token);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null unique references candidates(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  active_ms bigint not null default 0,
  last_heartbeat_at timestamptz,
  drive_folder_link text,
  video_link text,
  status session_status not null default 'in_progress',
  updated_at timestamptz not null default now()
);
create index sessions_candidate_idx on sessions(candidate_id);

create table events (
  id bigserial primary key,
  session_id uuid not null references sessions(id) on delete cascade,
  event_type event_type not null,
  occurred_at timestamptz not null default now(),
  duration_ms bigint,
  metadata jsonb
);
create index events_session_occurred_idx on events(session_id, occurred_at);

create table admin_audit (
  id bigserial primary key,
  action text not null,
  target_candidate_id uuid references candidates(id) on delete set null,
  occurred_at timestamptz not null default now()
);
