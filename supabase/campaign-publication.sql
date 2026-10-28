-- REVIEW ONLY. After Workspace lifecycle and workspace-draft-revisions.sql.
-- Only the JWT-verifying Edge function may call this service-only transaction.
begin;
create or replace function public.tasteprint_lock_public_campaign_owner()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
begin
 if new.campaign_id is distinct from old.campaign_id then
  raise exception using errcode='23505',message='campaign identity is immutable';
 end if;
 if new.workspace_id is distinct from old.workspace_id then
  -- Preserve the existing FK's deletion behavior; this is not tenant reassignment.
  if not (old.workspace_id is not null and new.workspace_id is null and
          not exists(select 1 from public.tasteprint_workspaces where id=old.workspace_id)) then
   raise exception using errcode='23505',message='campaign owner is immutable';
  end if;
 end if;
 return new;
end;$$;
revoke all on function public.tasteprint_lock_public_campaign_owner() from public,anon,authenticated;
drop trigger if exists tasteprint_public_campaign_owner on public.tasteprint_campaigns;
create trigger tasteprint_public_campaign_owner before update on public.tasteprint_campaigns
for each row execute function public.tasteprint_lock_public_campaign_owner();

create or replace function public.tasteprint_commit_campaign_publication(
 p_action text,p_workspace_id uuid,p_actor uuid,p_campaign_id text,p_manifest jsonb default null
) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
 v_role text; v_public public.tasteprint_campaigns%rowtype;
 v_draft public.tasteprint_workspace_campaigns%rowtype;
 v_version integer; v_now timestamptz:=now();
 v_previous_sub text:=current_setting('request.jwt.claim.sub',true);
 v_transient text[]:=array['localDraft','published','publishedAt','publishedVersion','workspace_id','workspaceId','owner','user'];
begin
 if p_actor is null or p_workspace_id is null or p_campaign_id is null or
    p_campaign_id !~ '^[a-z0-9][a-z0-9-]{0,63}$' or p_action is null or p_action not in ('publish','unpublish') then
  raise exception using errcode='22023',message='invalid publication request';
 end if;
 -- A role removal/demotion cannot commit between authorization and publication.
 perform 1 from public.tasteprint_workspaces where id=p_workspace_id for key share;
 select role into v_role from public.tasteprint_workspace_members
  where workspace_id=p_workspace_id and user_id=p_actor for share;
 if v_role is null or v_role not in ('owner','admin') then
  raise exception using errcode='42501',message='owner or admin permission required';
 end if;
 -- Serialize even the first claim of a not-yet-existing public ID across tenants.
 perform pg_advisory_xact_lock(hashtextextended('tasteprint-public-campaign:'||p_campaign_id,0));
 select * into v_public from public.tasteprint_campaigns where campaign_id=p_campaign_id for update;
 if found and v_public.workspace_id is distinct from p_workspace_id then
  raise exception using errcode='23505',message='campaign belongs to another workspace';
 end if;
 select * into v_draft from public.tasteprint_workspace_campaigns
  where workspace_id=p_workspace_id and campaign_id=p_campaign_id for update;
 if p_action='publish' then
  if jsonb_typeof(p_manifest) is distinct from 'object' or p_manifest->>'id' is distinct from p_campaign_id or
     octet_length(p_manifest::text)>250000 then
   raise exception using errcode='22023',message='invalid publication manifest';
  end if;
  if v_draft.campaign_id is null or (v_draft.manifest-v_transient) is distinct from p_manifest then
   raise exception using errcode='40001',message='team draft changed; save and review before publishing';
  end if;
 else
  if v_public.campaign_id is null then
   raise exception using errcode='42501',message='campaign is not owned by this workspace';
  end if;
 end if;
 -- Existing identity triggers get the verified server actor rather than a null
 -- service JWT subject. Client roles cannot execute this function or choose it.
 perform set_config('request.jwt.claim.sub',p_actor::text,true);
 if p_action='publish' then
  insert into public.tasteprint_campaigns as c(campaign_id,workspace_id,manifest,status,version,updated_at,published_at,updated_by)
   values(p_campaign_id,p_workspace_id,p_manifest,'published',1,v_now,v_now,p_actor)
  on conflict(campaign_id) do update set manifest=excluded.manifest,status='published',version=c.version+1,
   updated_at=v_now,published_at=v_now,updated_by=p_actor
   where c.workspace_id=p_workspace_id returning version into v_version;
  if not found then raise exception using errcode='23505',message='campaign belongs to another workspace';end if;
  update public.tasteprint_workspace_campaigns set manifest=p_manifest,status='published',version=version+1,updated_by=p_actor,updated_at=v_now
   where workspace_id=p_workspace_id and campaign_id=p_campaign_id returning * into v_draft;
 else
  update public.tasteprint_campaigns set status='archived',updated_at=v_now,updated_by=p_actor
   where campaign_id=p_campaign_id and workspace_id=p_workspace_id returning version into v_version;
  update public.tasteprint_workspace_campaigns set status='archived',version=version+1,updated_by=p_actor,updated_at=v_now
   where workspace_id=p_workspace_id and campaign_id=p_campaign_id returning * into v_draft;
 end if;
 perform set_config('request.jwt.claim.sub',coalesce(v_previous_sub,''),true);
 return jsonb_build_object('campaign_id',p_campaign_id,'status',case when p_action='publish' then 'published' else 'archived' end,
  'version',v_version,'published_at',case when p_action='publish' then v_now else v_public.published_at end,
  'draft_version',v_draft.version,'draft_created_at',v_draft.created_at);
end;$$;
revoke all on function public.tasteprint_commit_campaign_publication(text,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.tasteprint_commit_campaign_publication(text,uuid,uuid,text,jsonb) to service_role;
commit;
