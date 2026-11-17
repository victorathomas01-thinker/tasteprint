-- Run after passport-sync.sql as the staging SQL owner.
-- Temporary users and snapshots are rolled back together.
begin;

insert into auth.users (id)
values ('8026409c-27c9-40d0-99d4-bacc24e28801'),
       ('8026409c-27c9-40d0-99d4-bacc24e28802');

set local role authenticated;
select set_config('request.jwt.claim.sub', '8026409c-27c9-40d0-99d4-bacc24e28801', true);

insert into public.tasteprint_passport_snapshots (user_id, client_key, module_id, created_at)
values (auth.uid(), 'rls-smoke', 'escape', now());

do $$
begin
  if not exists (select 1 from public.tasteprint_passport_snapshots where client_key = 'rls-smoke') then
    raise exception 'Owner could not read their snapshot';
  end if;
  update public.tasteprint_passport_snapshots set archetype = 'updated'
    where client_key = 'rls-smoke';
  if not found then raise exception 'Owner could not update their snapshot'; end if;
end;
$$;

select set_config('request.jwt.claim.sub', '8026409c-27c9-40d0-99d4-bacc24e28802', true);

do $$
begin
  if exists (select 1 from public.tasteprint_passport_snapshots where client_key = 'rls-smoke') then
    raise exception 'A second account could read the owner snapshot';
  end if;
  update public.tasteprint_passport_snapshots set archetype = 'changed'
    where client_key = 'rls-smoke';
  if found then raise exception 'A second account could update the owner snapshot'; end if;
  delete from public.tasteprint_passport_snapshots where client_key = 'rls-smoke';
  if found then raise exception 'A second account could delete the owner snapshot'; end if;

  begin
    insert into public.tasteprint_passport_snapshots (user_id, client_key, module_id, created_at)
    values ('8026409c-27c9-40d0-99d4-bacc24e28801', 'rls-forged', 'escape', now());
    raise exception 'A second account could insert a snapshot for the owner';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

do $$
begin
  if exists (select 1 from public.tasteprint_passport_snapshots where client_key = 'rls-smoke') then
    raise exception 'An anonymous session could read the owner snapshot';
  end if;
exception when insufficient_privilege then
  null;
end;
$$;

rollback;
