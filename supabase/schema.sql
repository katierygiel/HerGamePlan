-- =====================================================================
-- Her Game Plan: database schema, privacy rules (RLS), and triggers
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- Safe to run on a fresh project. (To start over: Database -> reset, or drop the tables.)
-- =====================================================================

-- ---------- helpers ----------
create or replace function public.is_admin() returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return coalesce((select is_admin from public.profiles where id = auth.uid()), false);
end $$;

-- ---------- invite codes ----------
create table public.invite_codes (
  code text primary key,
  active boolean not null default true,
  max_uses int,
  uses int not null default 0,
  note text,
  created_at timestamptz not null default now()
);
insert into public.invite_codes (code, note) values ('PLAYMAKER26', 'Launch test group');

-- friendly pre-check used by the sign-up form (the real enforcement is the trigger below)
create or replace function public.check_invite(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.invite_codes
    where code = upper(trim(p_code)) and active and (max_uses is null or uses < max_uses)
  );
$$;
grant execute on function public.check_invite(text) to anon, authenticated;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text not null default '',
  last_name text not null default '',
  role text not null default '',
  headline text not null default '',
  bio text not null default '',
  city text not null default '',
  state text not null default '',
  phone text not null default '',
  portfolio text not null default '',
  resume text not null default '',
  photo_url text,
  years int not null default 0,
  interests text[] not null default '{}',
  onboarded boolean not null default false,
  settings jsonb not null default '{"notifications": true, "discoverable": true}',
  is_mentor boolean not null default false,
  mentor_field text,
  mentor_capacity text,
  expertise text[] not null default '{}',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- members can never promote themselves (admin / mentor / email are locked unless you are an admin
-- or are running SQL as the project owner)
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.is_admin := old.is_admin;
    new.is_mentor := old.is_mentor;
    new.email := old.email;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
create trigger trg_guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

-- new auth user: enforce the invite code, then create the profile + welcome notification
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_code text := upper(trim(coalesce(new.raw_user_meta_data->>'invite_code', '')));
begin
  update public.invite_codes set uses = uses + 1
    where code = v_code and active and (max_uses is null or uses < max_uses);
  if not found then
    raise exception 'INVALID_INVITE_CODE';
  end if;
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'first_name', ''), coalesce(new.raw_user_meta_data->>'last_name', ''));
  insert into public.notifications (user_id, kind, text, target)
  values (new.id, 'welcome', 'Welcome to Her Game Plan. Set your first goal to get started.', '{"name":"goals"}');
  return new;
end $$;
-- (trigger is created after the notifications table exists, see below)

-- ---------- goals ----------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  term text not null check (term in ('short', 'long')),
  title text not null check (char_length(title) between 1 and 160),
  is_public boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.goal_steps (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 160),
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create table public.goal_cheers (
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (goal_id, user_id)
);
create table public.goal_comments (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 600),
  created_at timestamptz not null default now()
);

-- ---------- articles (Tips & Tricks) ----------
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Career',
  read_min int not null default 4,
  author_label text not null default 'Her Game Plan',
  role_label text not null default '',
  excerpt text not null default '',
  blocks jsonb not null default '[]',
  image_key text,
  is_sample boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 600),
  created_at timestamptz not null default now()
);
create table public.bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  primary key (user_id, article_id)
);

-- ---------- community feed ----------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('update', 'win', 'question', 'event')),
  text text not null check (char_length(text) between 1 and 500),
  event_when text,
  event_where text,
  created_at timestamptz not null default now()
);
create table public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 600),
  created_at timestamptz not null default now()
);

-- ---------- messages ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (from_id <> to_id)
);
create index messages_to_idx on public.messages (to_id, created_at desc);
create index messages_from_idx on public.messages (from_id, created_at desc);

-- ---------- mentors ----------
create table public.mentor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  field text not null,
  expertise text[] not null default '{}',
  capacity text not null default 'Open to 1 mentee',
  why text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);
create unique index one_pending_mentor_app on public.mentor_applications (user_id) where status = 'pending';

create table public.mentor_requests (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'waitlisted', 'declined')),
  created_at timestamptz not null default now(),
  unique (mentee_id, mentor_id),
  check (mentee_id <> mentor_id)
);

-- ---------- social + safety ----------
create table public.connections (
  user_id uuid not null references public.profiles(id) on delete cascade,
  other_id uuid not null references public.profiles(id) on delete cascade,
  primary key (user_id, other_id),
  check (user_id <> other_id)
);
create table public.blocks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  primary key (user_id, blocked_id),
  check (user_id <> blocked_id)
);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('post', 'profile', 'comment', 'message')),
  target_id text not null,
  reason text not null default '',
  snapshot text not null default '',
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

-- ---------- notifications, activity, feedback, jobs interest ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'info',
  text text not null,
  target jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.activity_days (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'idea' check (kind in ('idea', 'bug', 'love', 'other')),
  text text not null check (char_length(text) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'done')),
  created_at timestamptz not null default now()
);

create table public.jobs_interest (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  roles text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- now that notifications exists, attach the sign-up trigger
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Row Level Security: who can see / change what
-- =====================================================================
alter table public.invite_codes enable row level security;
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.goal_steps enable row level security;
alter table public.goal_cheers enable row level security;
alter table public.goal_comments enable row level security;
alter table public.articles enable row level security;
alter table public.article_comments enable row level security;
alter table public.bookmarks enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.messages enable row level security;
alter table public.mentor_applications enable row level security;
alter table public.mentor_requests enable row level security;
alter table public.connections enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_days enable row level security;
alter table public.feedback enable row level security;
alter table public.jobs_interest enable row level security;

-- invite codes: admins only
create policy "admin manages invite codes" on public.invite_codes for all
  using (public.is_admin()) with check (public.is_admin());

-- profiles: any signed-in member can read; you edit only yourself; admins can edit anyone
create policy "members read profiles" on public.profiles for select to authenticated using (true);
create policy "edit own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "admin edits profiles" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- goals: private ones are visible only to the owner
create policy "see own or public goals" on public.goals for select to authenticated
  using (user_id = auth.uid() or is_public);
create policy "add own goals" on public.goals for insert to authenticated with check (user_id = auth.uid());
create policy "edit own goals" on public.goals for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own goals" on public.goals for delete to authenticated using (user_id = auth.uid());

create policy "see steps of visible goals" on public.goal_steps for select to authenticated
  using (exists (select 1 from public.goals g where g.id = goal_id));
create policy "manage steps on own goals" on public.goal_steps for all to authenticated
  using (exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()))
  with check (exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()));

create policy "see cheers on visible goals" on public.goal_cheers for select to authenticated
  using (exists (select 1 from public.goals g where g.id = goal_id));
create policy "cheer public goals" on public.goal_cheers for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.goals g where g.id = goal_id and g.is_public and g.user_id <> auth.uid()));
create policy "remove my cheer" on public.goal_cheers for delete to authenticated using (user_id = auth.uid());

create policy "see comments on visible goals" on public.goal_comments for select to authenticated
  using (exists (select 1 from public.goals g where g.id = goal_id));
create policy "comment on visible goals" on public.goal_comments for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.goals g where g.id = goal_id));
create policy "delete my goal comments" on public.goal_comments for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.goals g where g.id = goal_id and g.user_id = auth.uid()) or public.is_admin());

-- articles: members read published; admins publish
create policy "read published articles" on public.articles for select to authenticated
  using (published or public.is_admin());
create policy "admin writes articles" on public.articles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "read article comments" on public.article_comments for select to authenticated using (true);
create policy "add article comment" on public.article_comments for insert to authenticated with check (user_id = auth.uid());
create policy "delete article comment" on public.article_comments for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "my bookmarks" on public.bookmarks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- feed
create policy "read posts" on public.posts for select to authenticated using (true);
create policy "write own post" on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy "delete own post" on public.posts for delete to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "read likes" on public.post_likes for select to authenticated using (true);
create policy "like as me" on public.post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "unlike as me" on public.post_likes for delete to authenticated using (user_id = auth.uid());
create policy "read post comments" on public.post_comments for select to authenticated using (true);
create policy "comment as me" on public.post_comments for insert to authenticated with check (user_id = auth.uid());
create policy "delete post comment" on public.post_comments for delete to authenticated
  using (user_id = auth.uid() or public.is_admin()
         or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid()));

create or replace function public.is_blocked_by(p_blocker uuid, p_other uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
begin
  return exists (select 1 from public.blocks where user_id = p_blocker and blocked_id = p_other);
end $$;

-- messages: only the two people in the chat can see them; nobody can message someone who blocked them
create policy "read my messages" on public.messages for select to authenticated
  using (from_id = auth.uid() or to_id = auth.uid());
create policy "send as me" on public.messages for insert to authenticated
  with check (from_id = auth.uid()
    and not public.is_blocked_by(to_id, auth.uid()));
create policy "mark received as read" on public.messages for update to authenticated
  using (to_id = auth.uid()) with check (to_id = auth.uid());

create or replace function public.guard_message() returns trigger
language plpgsql as $$
begin
  new.from_id := old.from_id; new.to_id := old.to_id; new.text := old.text; new.created_at := old.created_at;
  return new;
end $$;
create trigger trg_guard_message before update on public.messages
  for each row execute function public.guard_message();

-- mentors
create policy "see my mentor applications" on public.mentor_applications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "apply to mentor" on public.mentor_applications for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending');
create policy "admin reviews applications" on public.mentor_applications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "see my mentor requests" on public.mentor_requests for select to authenticated
  using (mentee_id = auth.uid() or mentor_id = auth.uid() or public.is_admin());
create policy "request an approved mentor" on public.mentor_requests for insert to authenticated
  with check (mentee_id = auth.uid() and status = 'pending'
    and exists (select 1 from public.profiles p where p.id = mentor_id and p.is_mentor));
create policy "mentor answers requests" on public.mentor_requests for update to authenticated
  using (mentor_id = auth.uid()) with check (mentor_id = auth.uid());
create policy "mentee cancels request" on public.mentor_requests for delete to authenticated
  using (mentee_id = auth.uid());

create or replace function public.guard_mentor_request() returns trigger
language plpgsql as $$
begin
  new.mentee_id := old.mentee_id; new.mentor_id := old.mentor_id; new.message := old.message; new.created_at := old.created_at;
  return new;
end $$;
create trigger trg_guard_mentor_request before update on public.mentor_requests
  for each row execute function public.guard_mentor_request();

-- connections / blocks / reports
create policy "my connections" on public.connections for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "my blocks" on public.blocks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "file a report" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid());
create policy "admin reads reports" on public.reports for select to authenticated using (public.is_admin());
create policy "admin resolves reports" on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- notifications: yours only (created by database triggers, never by the browser)
create policy "read my notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "update my notifications" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete my notifications" on public.notifications for delete to authenticated using (user_id = auth.uid());

create policy "my activity" on public.activity_days for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "send feedback" on public.feedback for insert to authenticated with check (user_id = auth.uid());
create policy "admin reads feedback" on public.feedback for select to authenticated using (public.is_admin());
create policy "admin updates feedback" on public.feedback for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "my jobs interest" on public.jobs_interest for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin reads jobs interest" on public.jobs_interest for select to authenticated using (public.is_admin());

-- =====================================================================
-- Notification triggers (so people hear about cheers, replies, messages...)
-- =====================================================================
create or replace function public.full_name(p_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif(trim(first_name || ' ' || last_name), ''), 'Someone') from public.profiles where id = p_id;
$$;

create or replace function public.notify_goal_cheer() returns trigger
language plpgsql security definer set search_path = public as $$
declare g record;
begin
  select * into g from public.goals where id = new.goal_id;
  if g.user_id <> new.user_id then
    insert into public.notifications (user_id, kind, text, target)
    values (g.user_id, 'cheer', public.full_name(new.user_id) || ' cheered on your goal “' || g.title || '”',
            jsonb_build_object('name', 'goalSupport', 'params', jsonb_build_object('goalId', g.id)));
  end if;
  return new;
end $$;
create trigger trg_notify_goal_cheer after insert on public.goal_cheers
  for each row execute function public.notify_goal_cheer();

create or replace function public.notify_goal_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare g record;
begin
  select * into g from public.goals where id = new.goal_id;
  if g.user_id <> new.user_id then
    insert into public.notifications (user_id, kind, text, target)
    values (g.user_id, 'comment', public.full_name(new.user_id) || ' commented on your goal “' || g.title || '”',
            jsonb_build_object('name', 'goalSupport', 'params', jsonb_build_object('goalId', g.id)));
  end if;
  return new;
end $$;
create trigger trg_notify_goal_comment after insert on public.goal_comments
  for each row execute function public.notify_goal_comment();

create or replace function public.notify_post_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, kind, text, target)
    values (owner, 'comment', public.full_name(new.user_id) || ' replied to your post', '{"name":"connect"}');
  end if;
  return new;
end $$;
create trigger trg_notify_post_comment after insert on public.post_comments
  for each row execute function public.notify_post_comment();

create or replace function public.notify_post_like() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  select user_id into owner from public.posts where id = new.post_id;
  if owner is not null and owner <> new.user_id then
    insert into public.notifications (user_id, kind, text, target)
    values (owner, 'like', public.full_name(new.user_id) || ' liked your post', '{"name":"connect"}');
  end if;
  return new;
end $$;
create trigger trg_notify_post_like after insert on public.post_likes
  for each row execute function public.notify_post_like();

create or replace function public.notify_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- keep one unread "new message" notification per sender instead of a pile
  delete from public.notifications
    where user_id = new.to_id and kind = 'message' and not read
      and target->'params'->>'userId' = new.from_id::text;
  insert into public.notifications (user_id, kind, text, target)
  values (new.to_id, 'message', public.full_name(new.from_id) || ' sent you a message',
          jsonb_build_object('name', 'chat', 'params', jsonb_build_object('userId', new.from_id)));
  return new;
end $$;
create trigger trg_notify_message after insert on public.messages
  for each row execute function public.notify_message();

create or replace function public.notify_mentor_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, kind, text, target)
    values (new.mentor_id, 'mentor', public.full_name(new.mentee_id) || ' asked you to be their mentor',
            '{"name":"connect","params":{"view":"mentors"}}');
  elsif new.status <> old.status and new.status in ('accepted', 'waitlisted', 'declined') then
    insert into public.notifications (user_id, kind, text, target)
    values (new.mentee_id, 'mentor',
            case new.status
              when 'accepted' then public.full_name(new.mentor_id) || ' accepted your mentorship request'
              when 'waitlisted' then 'You''re on ' || public.full_name(new.mentor_id) || '''s waitlist'
              else public.full_name(new.mentor_id) || ' can''t take on a new mentee right now' end,
            jsonb_build_object('name', 'profile', 'params', jsonb_build_object('id', new.mentor_id)));
  end if;
  return new;
end $$;
create trigger trg_notify_mentor_request after insert or update on public.mentor_requests
  for each row execute function public.notify_mentor_request();

-- =====================================================================
-- Admin tools (callable only by admins)
-- =====================================================================
create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  return jsonb_build_object(
    'members', (select count(*) from public.profiles),
    'new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'active_7d', (select count(distinct user_id) from public.activity_days where day > current_date - 7),
    'goals', (select count(*) from public.goals),
    'public_goals', (select count(*) from public.goals where is_public),
    'posts', (select count(*) from public.posts),
    'messages', (select count(*) from public.messages),
    'mentors', (select count(*) from public.profiles where is_mentor),
    'mentor_requests', (select count(*) from public.mentor_requests),
    'mentor_apps_pending', (select count(*) from public.mentor_applications where status = 'pending'),
    'reports_open', (select count(*) from public.reports where status = 'open'),
    'jobs_interest', (select count(*) from public.jobs_interest),
    'feedback_new', (select count(*) from public.feedback where status = 'new'),
    'invite_uses', (select coalesce(sum(uses), 0) from public.invite_codes)
  );
end $$;

create or replace function public.review_mentor_application(p_id uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
declare a record;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  select * into a from public.mentor_applications where id = p_id and status = 'pending';
  if not found then return; end if;
  update public.mentor_applications set status = case when p_approve then 'approved' else 'declined' end where id = p_id;
  if p_approve then
    update public.profiles set is_mentor = true, mentor_field = a.field, expertise = a.expertise, mentor_capacity = a.capacity
      where id = a.user_id;
  end if;
  insert into public.notifications (user_id, kind, text, target)
  values (a.user_id, 'mentor',
          case when p_approve then 'You''re approved as a Her Game Plan mentor. Mentees can now find you.'
               else 'Thanks for applying to mentor. We''re not able to add you right now.' end,
          jsonb_build_object('name', 'connect', 'params', jsonb_build_object('view', 'mentors')));
end $$;

-- admin broadcast-free helper: remove a member (spam/abuse)
create or replace function public.admin_remove_member(p_id uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  if p_id = auth.uid() then raise exception 'CANNOT_REMOVE_SELF'; end if;
  delete from auth.users where id = p_id;
end $$;

-- members can delete their own account and everything attached to it
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'NOT_SIGNED_IN'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke execute on function public.admin_stats() from anon, public;
revoke execute on function public.review_mentor_application(uuid, boolean) from anon, public;
revoke execute on function public.admin_remove_member(uuid) from anon, public;
revoke execute on function public.delete_my_account() from anon, public;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.review_mentor_application(uuid, boolean) to authenticated;
grant execute on function public.admin_remove_member(uuid) to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- =====================================================================
-- Live updates (chat, notifications, feed refresh without reloading)
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['messages','notifications','posts','post_likes','post_comments','goals','goal_steps',
                           'goal_cheers','goal_comments','mentor_requests','profiles','articles','article_comments'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;
