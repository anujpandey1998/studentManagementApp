-- Run after local seed with psql -v ON_ERROR_STOP=1. All fixtures roll back.
begin;
do $$ begin
  assert (select count(*) from public.students)=60, 'Expected 60 students';
  assert (select count(*) from public.marks)=360, 'Expected 360 marks';
  assert (select count(*) from public.payments)=40, 'Expected 40 demo payments';
end $$;
insert into public.institutes(id,name) values ('90000000-0000-0000-0000-000000000001','Other institute');
insert into public.classes(institute_id,name,academic_year) values ('90000000-0000-0000-0000-000000000001','Private class','2026-2027');
set local role authenticated;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000003',true);
do $$ begin
  assert (select count(*) from public.students)=1, 'Student must see only self';
  assert (select count(*) from public.users)=1, 'Student must see only own profile';
  assert (select count(*) from public.marks)=6, 'Student must see own results';
  assert (select count(*) from public.fees)=1, 'Student must see own invoice';
  assert (select count(*) from public.classes)=3, 'Cross-tenant class leaked';
  assert (select count(*) from public.teacher_allocations)=0, 'Allocations leaked';
  begin
    update public.users set role='admin' where id=auth.uid();
    raise exception 'Role escalation unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.notices(institute_id,created_by,title,body) values
    ('10000000-0000-0000-0000-000000000001',auth.uid(),'Unauthorized','Unauthorized');
    raise exception 'Student notice insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000002',true);
do $$ begin
  assert (select count(*) from public.students)=60, 'Teacher allocation read failed';
  assert (select count(*) from public.payments)=0, 'Teacher financial access leaked';
  update public.attendance set status='late' where id=(select id from public.attendance limit 1);
  assert found, 'Teacher must be able to record assigned section attendance';
  begin
    insert into public.notices(institute_id,created_by,title,body) values
    ('10000000-0000-0000-0000-000000000001',auth.uid(),'Unauthorized school-wide','Unauthorized');
    raise exception 'Teacher school-wide notice unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',true);
do $$ begin
  assert (select count(*) from public.students)=60, 'Admin roster read failed';
  assert (select count(*) from public.institutes)=1, 'Cross-tenant admin access leaked';
  begin
    update public.payments set status='failed';
    raise exception 'Client payment modification unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
