-- REVIEW ONLY: catalog publishing permissions, no hosted activation or role seeding.
begin;
create table if not exists public.tasteprint_catalog_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check(role in ('contributor','reviewer','publisher','admin'))
);
create table if not exists public.tasteprint_catalog_entries (
 id text primary key check(id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
 author_id uuid not null references auth.users(id) on delete cascade,
 item jsonb not null, source_key text not null unique,
 version integer not null default 1 check(version>0),
 state text not null default 'draft' check(state in ('draft','review','approved','published','withdrawn')),
 reviewer_id uuid references auth.users(id) on delete set null,
 reviewed_at timestamptz, updated_at timestamptz not null default now(),
 check(author_id is distinct from reviewer_id)
);
create table if not exists public.tasteprint_catalog_history (
 id bigint generated always as identity primary key,
 entry_id text not null references public.tasteprint_catalog_entries(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null,
 version integer not null, action text not null, note text not null default '',
 item jsonb not null, occurred_at timestamptz not null default now(),
 unique(entry_id,version)
);
alter table public.tasteprint_catalog_roles enable row level security;
alter table public.tasteprint_catalog_entries enable row level security;
alter table public.tasteprint_catalog_history enable row level security;
revoke all on public.tasteprint_catalog_roles,public.tasteprint_catalog_entries,public.tasteprint_catalog_history from public,anon,authenticated;
revoke all on sequence public.tasteprint_catalog_history_id_seq from public,anon,authenticated;
create or replace function public.tasteprint_catalog_role()
returns text language sql stable security definer set search_path=public,extensions,pg_temp as $$select role from public.tasteprint_catalog_roles where user_id=auth.uid();$$;
create or replace function public.tasteprint_catalog_source_key(p_url text)
returns text language plpgsql immutable set search_path=public,extensions,pg_temp as $$
declare parts text[];query text;port text[];
begin
 if p_url is null or char_length(p_url)>2048 or p_url~'[[:space:]@\\]' then raise exception 'Use a safe HTTPS catalog URL';end if;
 parts:=regexp_match(p_url,'^https://([^/?#]+)([^?#]*)(\?[^#]*)?(#.*)?$');
 if parts is null or parts[1]!~'^([[:alnum:]][[:alnum:].-]*|\[[0-9A-Fa-f:]+\])(:[0-9]{1,5})?$' then raise exception 'Use a safe HTTPS catalog URL';end if;
 port:=regexp_match(parts[1],':([0-9]+)$');
 if port is not null and port[1]::integer>65535 then raise exception 'Use a valid HTTPS port';end if;
 if port is not null and port[1]='443' then parts[1]:=regexp_replace(parts[1],':443$','');end if;
 select string_agg(x,'&' order by x) into query from unnest(string_to_array(ltrim(coalesce(parts[3],''),'?'),'&')) x where x<>'' and lower(split_part(x,'=',1))!~'^(utm_|fbclid$)';
 return 'https://'||lower(parts[1])||rtrim(parts[2],'/')||case when query is not null then '?'||query else '' end;
end;$$;
create or replace function public.tasteprint_validate_catalog_item(p_item jsonb)
returns boolean language plpgsql stable set search_path=public,extensions,pg_temp as $$
declare key text;value jsonb;stamp timestamptz;
begin
 if jsonb_typeof(p_item) is distinct from 'object' or octet_length(p_item::text)>12000 or exists(select 1 from jsonb_object_keys(p_item) k where k not in ('id','title','description','category','tags','attributes','content_note','revision','status','location','constraints','availability','source','action_url')) then raise exception 'Invalid catalog fields';end if;
 foreach key in array array['id','title','description','category','status'] loop
  if jsonb_typeof(p_item->key) is distinct from 'string' then raise exception 'Required catalog text missing';end if;
 end loop;
 if (p_item->>'id')!~'^[a-z0-9][a-z0-9-]{0,63}$' or char_length(btrim(p_item->>'title')) not between 1 and 120 or char_length(btrim(p_item->>'description')) not between 1 and 600 or p_item->>'category' not in ('film','restaurant','cafe','event','product','hotel','activity') or p_item->>'status' not in ('active','withdrawn') then raise exception 'Invalid catalog listing';end if;
 if jsonb_typeof(p_item->'revision') is distinct from 'number' or (p_item->>'revision')!~'^[1-9][0-9]{0,8}$' then raise exception 'Invalid catalog revision';end if;
 if jsonb_typeof(p_item->'tags') is distinct from 'array' then raise exception 'Invalid catalog tags';end if;
 if jsonb_array_length(p_item->'tags') not between 1 and 12 or exists(select 1 from jsonb_array_elements(p_item->'tags') t where jsonb_typeof(t)<>'string' or t#>>'{}' not in ('animation','comedy','fantasy','drama','science-fiction','nature','art','coffee','cooking','walking','games','live-music')) then raise exception 'Invalid catalog tags';end if;
 foreach key in array array['location','content_note'] loop
  if coalesce(p_item->key,'null'::jsonb)<>'null'::jsonb and (jsonb_typeof(p_item->key)<>'string' or char_length(p_item->>key)>case when key='location' then 160 else 600 end) then raise exception 'Invalid catalog text';end if;
 end loop;
 if jsonb_typeof(p_item->'source') is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_item->'source') k where k not in ('url','publisher','note','verified_at')) then raise exception 'Invalid catalog source';end if;
 foreach key in array array['url','publisher','note'] loop
  if jsonb_typeof(p_item->'source'->key) is distinct from 'string' then raise exception 'Source details required';end if;
 end loop;
 if char_length(btrim(p_item->'source'->>'publisher')) not between 1 and 160 or char_length(btrim(p_item->'source'->>'note')) not between 1 and 1000 then raise exception 'Source details required';end if;
 perform public.tasteprint_catalog_source_key(p_item->'source'->>'url');
 if coalesce(p_item->'action_url','null'::jsonb)<>'null'::jsonb then
  if jsonb_typeof(p_item->'action_url')<>'string' then raise exception 'Invalid action URL';end if;
  perform public.tasteprint_catalog_source_key(p_item->>'action_url');
 end if;
 if coalesce(p_item->'source'->'verified_at','null'::jsonb)<>'null'::jsonb then
  if jsonb_typeof(p_item->'source'->'verified_at')<>'string' or (p_item->'source'->>'verified_at')!~'T.*(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception 'Invalid source check date';end if;
  stamp:=(p_item->'source'->>'verified_at')::timestamptz;
  if stamp>now() then raise exception 'Source check cannot be in future';end if;
 end if;
 if coalesce(p_item->'attributes','{}'::jsonb)<>'null'::jsonb then
  if jsonb_typeof(p_item->'attributes') is distinct from 'object' and p_item?'attributes' then raise exception 'Invalid catalog attributes';end if;
  for key,value in select * from jsonb_each(coalesce(p_item->'attributes','{}'::jsonb)) loop
   if key not in ('novelty','structure','social','aesthetic','comfort','energy','serenity','sentiment','curiosity','spontaneity') or jsonb_typeof(value)<>'number' or (value::text)::numeric not between 0 and 100 then raise exception 'Invalid preference attribute';end if;
  end loop;
 end if;
 if jsonb_typeof(p_item->'constraints') is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_item->'constraints') k where k not in ('cost','currency','duration_minutes','distance_km','step_free')) then raise exception 'Invalid catalog constraints';end if;
 foreach key in array array['cost','duration_minutes','distance_km'] loop
  value:=coalesce(p_item->'constraints'->key,'null'::jsonb);
  if value<>'null'::jsonb and (jsonb_typeof(value)<>'number' or (value::text)::numeric<0 or (value::text)::numeric>1.7976931348623157e308) then raise exception 'Invalid numeric constraint';end if;
 end loop;
 if coalesce(p_item->'constraints'->'currency','null'::jsonb)<>'null'::jsonb and (jsonb_typeof(p_item->'constraints'->'currency')<>'string' or (p_item->'constraints'->>'currency')!~'^[A-Z]{3}$') then raise exception 'Invalid currency';end if;
 if coalesce(p_item->'constraints'->'cost','null'::jsonb)<>'null'::jsonb and coalesce(p_item->'constraints'->>'currency','')!~'^[A-Z]{3}$' then raise exception 'Cost requires currency';end if;
 if coalesce(p_item->'constraints'->'step_free','null'::jsonb)<>'null'::jsonb and jsonb_typeof(p_item->'constraints'->'step_free')<>'boolean' then raise exception 'Invalid accessibility metadata';end if;
 if jsonb_typeof(p_item->'availability') is distinct from 'object' or exists(select 1 from jsonb_object_keys(p_item->'availability') k where k not in ('status','until')) or coalesce(p_item->'availability'->>'status','') not in ('unknown','available','unavailable') then raise exception 'Invalid availability';end if;
 if coalesce(p_item->'availability'->'until','null'::jsonb)<>'null'::jsonb then
  if jsonb_typeof(p_item->'availability'->'until')<>'string' or (p_item->'availability'->>'until')!~'T.*(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception 'Invalid availability date';end if;
  stamp:=(p_item->'availability'->>'until')::timestamptz;
 end if;
 return true;
end;$$;

create or replace function public.tasteprint_save_catalog_entry(p_item jsonb,p_expected_version integer)
returns integer language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid();r text:=public.tasteprint_catalog_role();entry public.tasteprint_catalog_entries;source text;next_version integer;
begin
 if actor is null or r is null then raise exception 'Catalog contributor access required';end if;
 perform public.tasteprint_validate_catalog_item(p_item);source:=public.tasteprint_catalog_source_key(p_item->'source'->>'url');
 perform pg_advisory_xact_lock(hashtextextended(actor::text,720));
 select * into entry from public.tasteprint_catalog_entries where id=p_item->>'id' for update;
 if found then
  if entry.author_id<>actor or entry.version is distinct from p_expected_version then raise exception 'Listing unavailable or changed';end if;
  if source<>entry.source_key or (p_item->>'revision')::integer<=(entry.item->>'revision')::integer then raise exception 'Keep source and increase revision';end if;
  next_version:=entry.version+1;
  update public.tasteprint_catalog_entries set item=p_item,version=next_version,state='draft',reviewer_id=null,reviewed_at=null,updated_at=now() where id=entry.id;
 else
  if p_expected_version is distinct from 0 then raise exception 'Listing unavailable or changed';end if;
  if (select count(*) from public.tasteprint_catalog_entries where author_id=actor)>=500 then raise exception 'Contributor draft limit reached';end if;
  insert into public.tasteprint_catalog_entries(id,author_id,item,source_key) values(p_item->>'id',actor,p_item,source);next_version:=1;
 end if;
 insert into public.tasteprint_catalog_history(entry_id,actor_id,version,action,item) values(p_item->>'id',actor,next_version,'save',p_item);
 return next_version;
end;$$;
create or replace function public.tasteprint_review_catalog_entry(p_id text,p_expected_version integer,p_action text,p_note text default '')
returns integer language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid();r text:=public.tasteprint_catalog_role();entry public.tasteprint_catalog_entries;next_state text;next_version integer;checked timestamptz;
begin
 if actor is null or r is null then raise exception 'Catalog access required';end if;
 if p_note is null or char_length(p_note)>500 or p_action is null then raise exception 'Invalid review';end if;
 select * into entry from public.tasteprint_catalog_entries where id=p_id for update;
 if not found or entry.version is distinct from p_expected_version then raise exception 'Listing unavailable or changed';end if;
 if p_action='submit' and actor=entry.author_id and entry.state='draft' and entry.item->>'status'='active' then next_state:='review';
 elsif p_action in ('approve','return') and r in ('reviewer','admin') and actor<>entry.author_id and entry.state='review' and char_length(btrim(p_note))>0 then
  if p_action='approve' then
   perform public.tasteprint_validate_catalog_item(entry.item);
   checked:=(entry.item->'source'->>'verified_at')::timestamptz;
   if checked is null or checked<now()-interval '30 days' or checked>now() then raise exception 'Recent manual source check required';end if;
   next_state:='approved';
  else next_state:='draft';end if;
 elsif p_action='publish' and r in ('publisher','admin') and actor<>entry.author_id and entry.state='approved' and entry.reviewer_id is not null then
  perform public.tasteprint_validate_catalog_item(entry.item);
  checked:=(entry.item->'source'->>'verified_at')::timestamptz;
  if checked is null or checked<now()-interval '30 days' or checked>now() then raise exception 'Source check is stale';end if;
  next_state:='published';
 elsif p_action='withdraw' and (actor=entry.author_id or r in ('reviewer','publisher','admin')) and entry.state<>'withdrawn' and char_length(btrim(p_note))>0 then next_state:='withdrawn';
 elsif p_action='remove' and actor=entry.author_id and entry.state in ('draft','withdrawn') then
  delete from public.tasteprint_catalog_entries where id=entry.id;return 0;
 else raise exception 'Review action not permitted';end if;
 next_version:=entry.version+1;
 update public.tasteprint_catalog_entries set version=next_version,state=next_state,updated_at=now(),
 reviewer_id=case when p_action='approve' then actor when p_action in ('submit','return','withdraw') then null else reviewer_id end,
 reviewed_at=case when p_action='approve' then now() when p_action in ('submit','return','withdraw') then null else reviewed_at end where id=entry.id;
 insert into public.tasteprint_catalog_history(entry_id,actor_id,version,action,note,item) values(entry.id,actor,next_version,p_action,btrim(p_note),entry.item);
 return next_version;
end;$$;
create or replace function public.tasteprint_my_catalog_entries()
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
declare r text:=public.tasteprint_catalog_role();items jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required';end if;
 if r is null then return jsonb_build_object('role',null,'entries','[]'::jsonb);end if;
 -- Never silently truncate a review queue. Pagination is required beyond this bound.
 if (select count(*) from public.tasteprint_catalog_entries where author_id=auth.uid() or (r in ('reviewer','admin') and state in ('review','approved','published')) or (r='publisher' and state in ('approved','published')))>2000 then raise exception 'Catalog queue requires pagination';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'item',e.item,'version',e.version,'state',e.state,'own',e.author_id=auth.uid(),'reviewed_at',e.reviewed_at,'updated_at',e.updated_at) order by e.updated_at desc,e.id),'[]'::jsonb) into items from public.tasteprint_catalog_entries e where e.author_id=auth.uid() or (r in ('reviewer','admin') and e.state in ('review','approved','published')) or (r='publisher' and e.state in ('approved','published'));
 return jsonb_build_object('role',r,'entries',items);
end;$$;
create or replace function public.tasteprint_catalog_entry_history(p_id text)
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
declare r text:=public.tasteprint_catalog_role();entry public.tasteprint_catalog_entries;
begin
 if auth.uid() is null or r is null then raise exception 'Catalog access required';end if;
 select * into entry from public.tasteprint_catalog_entries where id=p_id;
 if not found or (entry.author_id<>auth.uid() and not(r in ('reviewer','admin') and entry.state in ('review','approved','published')) and not(r='publisher' and entry.state in ('approved','published'))) then raise exception 'Listing unavailable';end if;
 if (select count(*) from public.tasteprint_catalog_history where entry_id=p_id)>2000 then raise exception 'History requires pagination';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('version',version,'action',action,'note',note,'item',item,'occurred_at',occurred_at) order by version) from public.tasteprint_catalog_history where entry_id=p_id),'[]'::jsonb);
end;$$;
-- Explicit public projection: no contributor IDs, drafts, notes, roles or histories.
create or replace function public.tasteprint_published_catalog(p_after text default '',p_limit integer default 100)
returns jsonb language plpgsql stable security definer set search_path=public,extensions,pg_temp as $$
begin
 if p_after is null or p_limit is null or p_limit not between 1 and 100 or char_length(p_after)>64 then raise exception 'Invalid catalog page';end if;
 return coalesce((select jsonb_agg(item order by id) from (select id,item from public.tasteprint_catalog_entries where state='published' and reviewer_id is not null and item->>'status'='active' and (item->'source'->>'verified_at')::timestamptz between now()-interval '30 days' and now() and id>p_after order by id limit p_limit) page),'[]'::jsonb);
end;$$;
revoke all on function public.tasteprint_catalog_role(),public.tasteprint_catalog_source_key(text),public.tasteprint_validate_catalog_item(jsonb),public.tasteprint_save_catalog_entry(jsonb,integer),public.tasteprint_review_catalog_entry(text,integer,text,text),public.tasteprint_my_catalog_entries(),public.tasteprint_catalog_entry_history(text),public.tasteprint_published_catalog(text,integer) from public,anon,authenticated;
grant execute on function public.tasteprint_catalog_role(),public.tasteprint_save_catalog_entry(jsonb,integer),public.tasteprint_review_catalog_entry(text,integer,text,text),public.tasteprint_my_catalog_entries(),public.tasteprint_catalog_entry_history(text) to authenticated;
grant execute on function public.tasteprint_published_catalog(text,integer) to anon,authenticated;
commit;
