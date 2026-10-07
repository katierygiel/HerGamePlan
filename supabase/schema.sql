-- Her Game Plan: starter Postgres schema (Supabase-ready).
-- Mirrors the entities in src/api/local.js. Row Level Security is sketched at the bottom:
-- review it carefully before launch, since this app holds personal data and private messages.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text not null, last_name text not null,
  headline text default '', role text default '', bio text default '',
  city text default '', state text default '', phone text default '',
  portfolio text default '', resume_url text default '', photo_url text,
  interests text[] default '{}',
  is_mentor boolean default false, mentor_field text, mentor_capacity text, mentor_expertise text[] default '{}',
  onboarded boolean default false, created_at timestamptz default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles on delete cascade,
  term text not null check (term in ('short','long')),
  title text not null, is_public boolean default false,
  completed_at timestamptz, created_at timestamptz default now()
);
create table goal_steps (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals on delete cascade,
  label text not null, done boolean default false, position int default 0
);
create table goal_cheers (
  goal_id uuid references goals on delete cascade, user_id uuid references profiles on delete cascade,
  primary key (goal_id, user_id)
);

-- one table for every comment thread (goals, articles, posts)
create table comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('goal','article','post')),
  target_id uuid not null,
  author_id uuid not null references profiles on delete cascade,
  body text not null check (char_length(body) <= 500),
  created_at timestamptz default now()
);
create index on comments (target_type, target_id, created_at);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid references profiles on delete set null,   -- null when anonymous
  anonymous boolean default false,
  title text not null, company text not null, location text, remote boolean default false,
  type text check (type in ('Full-time','Part-time','Internship','Freelance')),
  pay text, description text, requirements text[] default '{}', tags text[] default '{}',
  created_at timestamptz default now()
);
create table saved_jobs (user_id uuid references profiles on delete cascade, job_id uuid references jobs on delete cascade, primary key (user_id, job_id));
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  job_id uuid references jobs on delete set null,
  job_title text not null, company text not null,           -- snapshot, survives job deletion
  status text not null default 'applied' check (status in ('applied','interviewing','offer','closed')),
  note text default '', form jsonb default '{}', created_at timestamptz default now(),
  unique (user_id, job_id)
);

create table articles (
  id uuid primary key default gen_random_uuid(), author_id uuid references profiles,
  title text not null, category text, excerpt text, blocks jsonb not null, photo_url text,
  published_at timestamptz default now()
);
create table bookmarks (user_id uuid references profiles on delete cascade, article_id uuid references articles on delete cascade, primary key (user_id, article_id));

create table posts (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references profiles on delete cascade,
  kind text not null check (kind in ('update','win','question','event')),
  body text not null check (char_length(body) <= 400), event_when text, event_where text,
  created_at timestamptz default now()
);
create table post_likes (post_id uuid references posts on delete cascade, user_id uuid references profiles on delete cascade, primary key (post_id, user_id));

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references profiles on delete cascade, user_b uuid not null references profiles on delete cascade,
  unique (user_a, user_b), check (user_a < user_b)
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations on delete cascade,
  sender_id uuid not null references profiles on delete cascade,
  body text not null, read_at timestamptz, created_at timestamptz default now()
);

create table mentor_requests (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references profiles on delete cascade, mentor_id uuid not null references profiles on delete cascade,
  message text, status text not null default 'pending' check (status in ('pending','accepted','waitlisted','declined')),
  created_at timestamptz default now(), unique (mentee_id, mentor_id)
);
create table connections (user_id uuid references profiles on delete cascade, other_id uuid references profiles on delete cascade, primary key (user_id, other_id));
create table blocks (user_id uuid references profiles on delete cascade, blocked_id uuid references profiles on delete cascade, primary key (user_id, blocked_id));
create table reports (
  id uuid primary key default gen_random_uuid(), reporter_id uuid references profiles,
  target_type text not null, target_id text not null, reason text, created_at timestamptz default now()
);
create table notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references profiles on delete cascade,
  kind text, body text not null, target jsonb, read boolean default false, created_at timestamptz default now()
);
create table activity_days (user_id uuid references profiles on delete cascade, day date, primary key (user_id, day));  -- powers streaks

-- ---------- Row Level Security (sketch: extend before launch) ----------
alter table profiles enable row level security;
alter table goals enable row level security;
alter table messages enable row level security;
alter table applications enable row level security;

create policy "profiles are readable by members" on profiles for select using (auth.role() = 'authenticated');
create policy "edit own profile" on profiles for update using (auth.uid() = id);
create policy "own goals, or public goals" on goals for select using (owner_id = auth.uid() or is_public);
create policy "manage own goals" on goals for all using (owner_id = auth.uid());
create policy "only my applications" on applications for all using (user_id = auth.uid());
create policy "read messages in my conversations" on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id and auth.uid() in (c.user_a, c.user_b)));
create policy "send as myself" on messages for insert with check (sender_id = auth.uid());
-- TODO: policies for the remaining tables (comments, posts, jobs, blocks, etc.)
