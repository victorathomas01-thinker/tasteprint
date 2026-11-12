-- TEST FIXTURE ONLY. Not a hosted rollback or live migration.
-- Exact database name and explicit session opt-in prevent accidental execution.
begin;
do $$begin
 if current_database()<>'tasteprint_social_recovery_fixture'
  or current_setting('tasteprint.allow_fixture_teardown',true) is distinct from 'yes'
 then raise exception 'Fixture teardown requires its disposable database and explicit opt-in'; end if;
end$$;
drop function public.tasteprint_export_my_plan_participation(uuid,integer);
drop function public.tasteprint_remove_my_plan_participation(uuid);
drop function public.tasteprint_cleanup_my_expired_plan_invites();
drop function public.tasteprint_create_private_plan(text,text);
drop function public.tasteprint_accept_plan_invite(text);
drop function public.tasteprint_respond_private_plan(uuid,text,integer,jsonb);
drop function public.tasteprint_delete_my_private_plan(uuid);
-- RESTRICT is intentional: an unexpected dependency must abort the transaction.
drop table public.tasteprint_social_plan_invites restrict;
drop table public.tasteprint_social_plan_responses restrict;
drop table public.tasteprint_social_blocks restrict;
drop table public.tasteprint_social_plans restrict;
drop function public.tasteprint_social_can_read(uuid);
commit;
