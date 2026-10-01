-- ============================================================
-- QUEST — databáza (Supabase)
-- Spusti celé v Supabase → SQL Editor. Potom 02_quests_seed.sql.
-- Bezpečné spustiť na prázdnom projekte.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMY ----------
create type quest_mood   as enum ('pomoc','adrenalin','nuda','cakanie');
create type helpgang     as enum ('builders','speedrunners','nightcrawlers','looters');
create type quest_env    as enum ('doma','vonku','mesto','praca','online','hocikde');
create type proof_kind   as enum ('photo','video','voice');
create type trans_status as enum ('official','community','needs_review');

-- ---------- PROFILY ----------
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null check (char_length(username) between 2 and 20),
  gang            helpgang,
  lang            text not null default 'sk' check (lang in ('sk','en')),
  country         text,
  xp              integer not null default 0,
  streak_current  integer not null default 0,
  streak_best     integer not null default 0,
  last_done_date  date,
  is_adult_16     boolean not null default false check (is_adult_16),
  is_admin        boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ---------- KNIŽNICA QUESTOV ----------
create table quests (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  title_sk           text not null,
  title_en           text not null,
  description_sk     text not null,
  description_en     text not null,
  mood               quest_mood not null,
  gang               helpgang not null,
  environment        quest_env not null,
  difficulty         smallint not null check (difficulty between 1 and 3),
  duration_min       integer not null,
  xp                 integer not null,
  proof_type         proof_kind not null,
  is_daily_eligible  boolean not null default false,
  is_active          boolean not null default true,
  translation_status trans_status not null default 'official',
  submitted_by       uuid references profiles(id) on delete set null,
  created_at         timestamptz not null default now()
);
create index quests_mood_idx  on quests (mood) where is_active;
create index quests_daily_idx on quests (is_daily_eligible) where is_active;

-- ---------- SVETOVÝ QUEST NA DEŇ (UTC) ----------
create table daily_quests (
  quest_date       date primary key,
  quest_id         uuid references quests(id) on delete set null,
  custom_title_sk  text,
  custom_title_en  text,
  custom_desc_sk   text,
  custom_desc_en   text,
  proof_type       proof_kind not null default 'photo',
  xp               integer not null default 100,
  sponsor_name     text,
  sponsor_logo_url text,
  sponsor_url      text,
  metric_sk        text,                       -- jednotka, napr. 'kusov odpadu' (prázdne = bez počítania)
  metric_en        text,                       -- 'pieces of litter'
  metric_max       integer not null default 500 check (metric_max > 0),  -- strop na človeka proti preklepom a podvodom
  world_goal       integer check (world_goal > 0),                       -- spoločný cieľ celého sveta (nepovinné)
  created_at       timestamptz not null default now(),
  check (quest_id is not null or custom_title_sk is not null)
);

-- ---------- SPLNENIA ----------
create table completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  quest_id     uuid references quests(id) on delete set null,
  quest_date   date references daily_quests(quest_date) on delete set null,  -- vyplnené = svetový quest
  proof_url    text not null,
  proof_type   proof_kind not null,
  note         text,
  city         text,                         -- hrubé mesto podľa časového pásma, nie GPS
  country      text,                         -- ISO kód krajiny (SK, CZ, …) podľa časového pásma/jazyka
  region       text,                         -- svetadiel podľa časového pásma (Europe, America, …)
  amount       integer check (amount >= 0),  -- napr. koľko kusov odpadu človek zozbieral
  rating       smallint check (rating between 1 and 5),
  hype_count   integer not null default 0,
  is_public    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (user_id, quest_date)               -- svetový quest len raz za deň
);
create index completions_created_idx on completions (created_at desc);
create index completions_date_idx    on completions (quest_date);

-- ---------- HYPE ----------
create table hypes (
  completion_id uuid not null references completions(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (completion_id, user_id)
);

-- ---------- NÁVRHY OD KOMUNITY ----------
create table quest_submissions (
  id            uuid primary key default gen_random_uuid(),
  submitted_by  uuid references profiles(id) on delete set null,
  kind          text not null check (kind in ('new_quest','translation_fix','report')),
  target_quest  uuid references quests(id) on delete set null,
  target_completion uuid references completions(id) on delete cascade,  -- nahlásený príspevok
  lang          text,
  title         text,
  body          text not null check (char_length(body) between 3 and 2000),
  status        text not null default 'new' check (status in ('new','accepted','rejected')),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- FUNKCIE
-- ============================================================

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false)
$$;

-- Počítadlo pre obrazovku Dnes: koľko ľudí a z koľkých miest
create or replace view daily_counter as
select quest_date,
       count(*)::int               as done_count,
       count(distinct city)::int   as city_count
from completions
where quest_date is not null
group by quest_date;

-- Svetový quest na daný deň. Ak ho nikto nenapísal, vytiahne sa
-- náhodný zo zásobníka, ktorý sa 90 dní nepoužil.
create or replace function ensure_daily_quest(d date default (now() at time zone 'utc')::date)
returns daily_quests
language plpgsql security definer set search_path = public as $$
declare row daily_quests;
begin
  select * into row from daily_quests where quest_date = d;
  if found then return row; end if;

  insert into daily_quests (quest_date, quest_id, proof_type, xp)
  select d, q.id, q.proof_type, q.xp * 2
  from quests q
  where q.is_active and q.is_daily_eligible
    and q.id not in (
      select quest_id from daily_quests where quest_id is not null and quest_date > d - 90
    )
  order by random()
  limit 1
  on conflict (quest_date) do nothing
  returning * into row;

  if row.quest_date is null then
    select * into row from daily_quests where quest_date = d;
  end if;
  return row;
end $$;

-- Splnenie questu. XP a séria sa počítajú TU na serveri —
-- appka ich nemôže poslať sama, takže sa nedajú podvádzať.
create or replace function complete_quest(
  p_quest_id   uuid,
  p_daily      boolean,
  p_proof_url  text,
  p_proof_type proof_kind,
  p_rating     smallint default null,
  p_city       text default null,
  p_amount     integer default null,
  p_country    text default null,
  p_region     text default null
) returns table (gained integer, streak integer, rank integer)
language plpgsql security definer set search_path = public as $$
declare
  uid   uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
  prof  profiles;
  dq    daily_quests;
  pts   integer;
  st    integer;
begin
  if uid is null then raise exception 'Nie si prihlásený.' using errcode = '28000'; end if;

  -- dôkaz musí ležať v tvojom vlastnom priečinku úložiska
  if position('/proofs/' || uid::text || '/' in p_proof_url) = 0 then
    raise exception 'Neplatný dôkaz.' using errcode = '22023';
  end if;

  select * into prof from profiles where id = uid for update;
  if not found then raise exception 'Chýba profil.' using errcode = 'P0002'; end if;

  if p_daily then
    dq := ensure_daily_quest(today);
    if dq.quest_date is null then raise exception 'Na dnes nie je svetový quest.'; end if;
    pts := dq.xp;
    if dq.metric_sk is not null then
      if p_amount is null or p_amount < 0 or p_amount > dq.metric_max then
        raise exception 'Zadaj počet od 0 do %.', dq.metric_max using errcode = '22023';
      end if;
    else
      p_amount := null;
    end if;
    begin
      insert into completions (user_id, quest_id, quest_date, proof_url, proof_type, rating, city, country, region, amount)
      values (uid, dq.quest_id, today, p_proof_url, p_proof_type, p_rating, p_city, upper(left(p_country, 2)), left(p_region, 20), p_amount);
    exception when unique_violation then
      raise exception 'Dnešný svetový quest už máš splnený.' using errcode = '23505';
    end;

    st := case
      when prof.last_done_date = today     then prof.streak_current
      when prof.last_done_date = today - 1 then prof.streak_current + 1
      else 1 end;

    update profiles
       set xp = xp + pts,
           streak_current = st,
           streak_best = greatest(streak_best, st),
           last_done_date = today
     where id = uid;
  else
    select q.xp into pts from quests q where q.id = p_quest_id and q.is_active;
    if pts is null then raise exception 'Neznámy quest.' using errcode = 'P0002'; end if;

    -- ten istý quest zo zásobníka najviac raz za deň
    if exists (
      select 1 from completions
      where user_id = uid and quest_id = p_quest_id and quest_date is null
        and (created_at at time zone 'utc')::date = today
    ) then
      raise exception 'Tento quest si dnes už splnil.' using errcode = '23505';
    end if;

    insert into completions (user_id, quest_id, quest_date, proof_url, proof_type, rating, city, country, region)
    values (uid, p_quest_id, null, p_proof_url, p_proof_type, p_rating, p_city, upper(left(p_country, 2)), left(p_region, 20));

    st := prof.streak_current;
    update profiles set xp = xp + pts where id = uid;
  end if;

  return query
    select pts, st, (select count(*)::int from completions where quest_date = today);
end $$;

-- Hype počítadlo (beží s právami databázy, nie používateľa)
create or replace function bump_hype() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update completions set hype_count = hype_count + 1 where id = new.completion_id;
    return new;
  else
    update completions set hype_count = greatest(0, hype_count - 1) where id = old.completion_id;
    return old;
  end if;
end $$;

create trigger hypes_bump after insert or delete on hypes
for each row execute function bump_hype();

-- Gangy sa odomknú po 5 splnených questoch. Ostať bez gangu (null) sa dá vždy.
create or replace function choose_gang(p_gang helpgang) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); done int;
begin
  if uid is null then raise exception 'Nie si prihlásený.' using errcode = '28000'; end if;
  if p_gang is not null then
    select count(*) into done from completions where user_id = uid;
    if done < 5 then
      raise exception 'Gangy sa odomknú po 5 splnených questoch.' using errcode = '42501';
    end if;
  end if;
  update profiles set gang = p_gang where id = uid;
end $$;

-- Čísla pre sponzorov (len admin)
create or replace function admin_stats() returns json
language plpgsql stable security definer set search_path = public as $$
declare today date := (now() at time zone 'utc')::date;
begin
  if not is_admin() then raise exception 'Len pre admina.' using errcode = '42501'; end if;
  return json_build_object(
    'users_total',   (select count(*) from profiles),
    'users_7d',      (select count(*) from profiles where created_at > now() - interval '7 days'),
    'active_7d',     (select count(distinct user_id) from completions where created_at > now() - interval '7 days'),
    'done_today',    (select count(*) from completions where quest_date = today),
    'done_total',    (select count(*) from completions),
    'cities_total',  (select count(distinct city) from completions where city is not null),
    'per_day',       (select coalesce(json_agg(d order by d.day), '[]'::json) from (
                        select (created_at at time zone 'utc')::date as day, count(*) as n
                        from completions where created_at > now() - interval '14 days'
                        group by 1) d),
    'top_cities',    (select coalesce(json_agg(c), '[]'::json) from (
                        select city, count(*) as n from completions
                        where city is not null group by city order by n desc limit 5) c)
  );
end $$;

-- Štatistiky svetového questu: súčet, priemer, rekord, rebríčky gangov,
-- krajín, regiónov a miest + tvoje poradie. Skryté (nahlásené) príspevky sa nerátajú.
create or replace function quest_stats(d date default (now() at time zone 'utc')::date)
returns json
language sql stable security definer set search_path = public as $$
  with c as (
    select c.amount, c.country, c.region, c.city, c.user_id, p.username,
           coalesce(p.gang::text, 'world') as gang
    from completions c
    join profiles p on p.id = c.user_id
    where c.quest_date = d and c.is_public and c.amount is not null
  ),
  me as (
    select amount from c where user_id = auth.uid()
  )
  select json_build_object(
    'quest_date', d,
    'total',  coalesce((select sum(amount) from c), 0),
    'people', (select count(*) from c),
    'avg',    coalesce((select round(avg(amount)::numeric, 1) from c), 0),
    'median', coalesce((select percentile_cont(0.5) within group (order by amount) from c), 0),
    'record', (select json_build_object('username', username, 'amount', amount, 'city', city)
               from c order by amount desc, username limit 1),
    'by_gang', coalesce((select json_agg(g order by g.avg desc) from (
                 select gang as key, sum(amount)::int as total, count(*)::int as people,
                        round(avg(amount)::numeric, 1) as avg
                 from c group by gang) g), '[]'::json),
    'by_country', coalesce((select json_agg(g order by g.total desc) from (
                 select country as key, sum(amount)::int as total, count(*)::int as people,
                        round(avg(amount)::numeric, 1) as avg
                 from c where country is not null group by country order by sum(amount) desc limit 10) g), '[]'::json),
    'by_region', coalesce((select json_agg(g order by g.total desc) from (
                 select region as key, sum(amount)::int as total, count(*)::int as people,
                        round(avg(amount)::numeric, 1) as avg
                 from c where region is not null group by region) g), '[]'::json),
    'by_city', coalesce((select json_agg(g order by g.total desc) from (
                 select city as key, sum(amount)::int as total, count(*)::int as people,
                        round(avg(amount)::numeric, 1) as avg
                 from c where city is not null group by city order by sum(amount) desc limit 10) g), '[]'::json),
    'me', (select json_build_object(
              'amount', me.amount,
              'rank',   (select count(*) from c where c.amount > me.amount) + 1,
              'of',     (select count(*) from c),
              'beaten', (select count(*) from c where c.amount < me.amount))
           from me)
  )
$$;

-- Admin skryje nahlásený príspevok z feedu
create or replace function hide_completion(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'Len pre admina.' using errcode = '42501'; end if;
  update completions set is_public = false where id = p_id;
  update quest_submissions set status = 'accepted' where target_completion = p_id and status = 'new';
end $$;

-- Zmazanie vlastného účtu (GDPR): zmaže profil, splnenia, hype aj prihlásenie
create or replace function delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Nie si prihlásený.' using errcode = '28000'; end if;
  delete from storage.objects where bucket_id = 'proofs' and (storage.foldername(name))[1] = uid::text;
  delete from auth.users where id = uid;
end $$;

-- ============================================================
-- PRÁVA A BEZPEČNOSŤ (RLS)
-- ============================================================

alter table profiles          enable row level security;
alter table quests            enable row level security;
alter table daily_quests      enable row level security;
alter table completions       enable row level security;
alter table hypes             enable row level security;
alter table quest_submissions enable row level security;

-- profily: každý vidí, meniť sa dá len vlastný a len niektoré stĺpce
create policy profiles_read   on profiles for select using (true);
create policy profiles_insert on profiles for insert with check (auth.uid() = id and not is_admin and xp = 0 and gang is null);
create policy profiles_update on profiles for update using (auth.uid() = id);
revoke update on profiles from anon, authenticated;
grant  update (username, lang, country) on profiles to authenticated;

-- knižnica questov: čítajú všetci, mení admin
create policy quests_read  on quests for select using (true);
create policy quests_admin on quests for all using (is_admin()) with check (is_admin());

-- svetový quest: čítajú všetci, plánuje admin
create policy daily_read  on daily_quests for select using (true);
create policy daily_admin on daily_quests for all using (is_admin()) with check (is_admin());

-- splnenia: verejné vidia všetci, zapisuje sa len cez complete_quest()
create policy completions_read   on completions for select using (is_public or auth.uid() = user_id);
create policy completions_delete on completions for delete using (auth.uid() = user_id);
revoke insert, update on completions from anon, authenticated;

-- hype: jeden človek raz
create policy hypes_read   on hypes for select using (true);
create policy hypes_insert on hypes for insert with check (auth.uid() = user_id);
create policy hypes_delete on hypes for delete using (auth.uid() = user_id);

-- návrhy: poslať môže prihlásený, čítať svoje, spravovať admin
create policy subm_insert on quest_submissions for insert with check (auth.uid() = submitted_by);
create policy subm_read   on quest_submissions for select using (auth.uid() = submitted_by or is_admin());
create policy subm_admin  on quest_submissions for update using (is_admin()) with check (is_admin());

grant select on daily_counter to anon, authenticated;
grant execute on function ensure_daily_quest(date) to anon, authenticated;
grant execute on function complete_quest(uuid, boolean, text, proof_kind, smallint, text, integer, text, text) to authenticated;
revoke execute on function complete_quest(uuid, boolean, text, proof_kind, smallint, text, integer, text, text) from anon;
grant execute on function is_admin() to anon, authenticated;
grant execute on function hide_completion(uuid) to authenticated;
grant execute on function choose_gang(helpgang) to authenticated;
grant execute on function quest_stats(date) to anon, authenticated;
grant execute on function admin_stats() to authenticated;
revoke execute on function admin_stats() from anon;
revoke execute on function choose_gang(helpgang) from anon;
grant execute on function delete_my_account() to authenticated;
revoke execute on function hide_completion(uuid) from anon;
revoke execute on function delete_my_account() from anon;

-- ============================================================
-- ÚLOŽISKO DÔKAZOV (fotky, videá, hlasovky)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', true, 52428800,
        array['image/jpeg','image/png','image/webp','image/heic','image/heif',
              'video/mp4','video/quicktime','video/webm',
              'audio/webm','audio/mp4','audio/mpeg','audio/ogg','audio/wav','audio/x-m4a'])
on conflict (id) do nothing;

create policy proofs_read on storage.objects for select
  using (bucket_id = 'proofs');

-- nahrávať sa dá len do vlastného priečinka: proofs/<moje-id>/...
create policy proofs_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy proofs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- REALTIME — glóbus počúva nové splnenia naživo
-- ============================================================
alter publication supabase_realtime add table completions;
