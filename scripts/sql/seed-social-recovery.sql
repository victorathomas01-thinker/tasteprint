\set ON_ERROR_STOP on
create table public.recovery_unrelated_sentinel(id integer primary key,value text);
insert into public.recovery_unrelated_sentinel values(1,'Unrelated application data stays intact');
insert into auth.users values('11111111-1111-1111-1111-111111111111'),('22222222-2222-2222-2222-222222222222'),('33333333-3333-3333-3333-333333333333');
insert into public.tasteprint_social_plans(id,creator_id,recipient_id,title,state,revision,details,expires_at) values
 ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','Synthetic agreed film','scheduled',2,jsonb_build_object('starts_at',now()+interval '2 days','place','Synthetic venue'),null),
 ('a0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111',null,'Synthetic pending invitation','proposed',1,'{}',now()+interval '1 day'),
 ('a0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333','Synthetic blocked record','mutual_interest',1,'{}',null);
insert into public.tasteprint_social_plan_responses(plan_id,actor_id,interest,approved_revision) values
 ('a0000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','interested',2),
 ('a0000000-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','interested',2),
 ('a0000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','pending',null),
 ('a0000000-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','interested',null),
 ('a0000000-0000-0000-0000-000000000003','33333333-3333-3333-3333-333333333333','interested',null);
insert into public.tasteprint_social_plan_invites(plan_id,token_hash,expires_at) values
 ('a0000000-0000-0000-0000-000000000002',encode(extensions.digest(repeat('c',64),'sha256'),'hex'),now()+interval '1 day');
insert into public.tasteprint_social_blocks values('11111111-1111-1111-1111-111111111111','33333333-3333-3333-3333-333333333333');
