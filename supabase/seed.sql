-- LOCAL DEVELOPMENT ONLY. supabase db reset replaces the local database.
begin;
insert into public.institutes(id,name) values ('10000000-0000-0000-0000-000000000001','Vidya Academy');
-- Fixed IDs keep demo relationships reproducible. Never run this on production.
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
select '00000000-0000-0000-0000-000000000000', ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
'authenticated','authenticated', email, extensions.crypt('VidyaDemo!2026',extensions.gen_salt('bf')),now(),
'{"provider":"email","providers":["email"]}'::jsonb,jsonb_build_object('full_name',name),now(),now(),'','','',''
from (values (1,'admin@vidya.example','Ananya Mehta'),(2,'teacher@vidya.example','Rohan Sharma'),(3,'student@vidya.example','Aarav Sharma')) demo(n,email,name);
insert into auth.identities(id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
select gen_random_uuid(),id,id::text,jsonb_build_object('sub',id::text,'email',email,'email_verified',true),'email',now(),now(),now()
from auth.users where email in ('admin@vidya.example','teacher@vidya.example','student@vidya.example');
insert into public.users(id,institute_id,full_name,role)
select id,'10000000-0000-0000-0000-000000000001',raw_user_meta_data->>'full_name',
case email when 'admin@vidya.example' then 'admin' when 'teacher@vidya.example' then 'teacher' else 'student' end::public.app_role
from auth.users where email in ('admin@vidya.example','teacher@vidya.example','student@vidya.example');
insert into public.classes(id,institute_id,name,academic_year)
select ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001','Class '||(n+7),'2026-2027' from generate_series(1,3) n;
insert into public.sections(id,institute_id,class_id,name)
select ('40000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001',
('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'A' from generate_series(1,3) n;
insert into public.subjects(id,institute_id,name,code)
select ('50000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001',name,code
from (values(1,'Mathematics','MATH'),(2,'Science','SCI'),(3,'English','ENG')) s(n,name,code);
insert into public.teacher_allocations
select s.institute_id,s.id,sub.id,'20000000-0000-0000-0000-000000000002' from public.sections s cross join public.subjects sub;
insert into public.students(id,institute_id,section_id,user_id,admission_number,full_name,date_of_birth,guardian_name,guardian_phone)
select ('60000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'10000000-0000-0000-0000-000000000001',
('40000000-0000-0000-0000-'||lpad(((n-1)/20+1)::text,12,'0'))::uuid,
case when n=1 then '20000000-0000-0000-0000-000000000003'::uuid end,
'VA26-'||lpad(n::text,4,'0'),
(array['Aarav','Diya','Ishaan','Ananya','Vihaan','Saanvi','Arjun','Aditi','Kabir','Meera','Rudra','Kavya','Advik','Riya','Aryan','Nisha','Dev','Tara','Om','Sara'])[(n-1)%20+1]||' '||
(array['Sharma','Patel','Singh'])[(n-1)/20+1],
date '2013-01-01' + (n*17)%365 - ((n-1)/20)*365,
'Guardian '||n,'90000'||lpad(n::text,5,'0') from generate_series(1,60) n;
insert into public.attendance(institute_id,section_id,student_id,attendance_date,status,recorded_by)
select s.institute_id,s.section_id,s.id,current_date-d,
case when (right(s.admission_number,4)::int+d)%13=0 then 'absent' when (right(s.admission_number,4)::int+d)%17=0 then 'late' else 'present' end::public.attendance_status,
'20000000-0000-0000-0000-000000000002' from public.students s cross join generate_series(1,35) d
where extract(isodow from current_date-d) between 1 and 5;
insert into public.exams(id,institute_id,section_id,name,exam_date)
select ('70000000-0000-0000-0000-'||lpad(row_number() over(order by s.id,n)::text,12,'0'))::uuid,
s.institute_id,s.id,case n when 1 then 'Unit Test 1' else 'Midterm' end,current_date-(case n when 1 then 28 else 7 end)
from public.sections s cross join generate_series(1,2) n;
insert into public.exam_subjects select e.institute_id,e.section_id,e.id,s.id,100 from public.exams e cross join public.subjects s;
insert into public.marks(institute_id,section_id,student_id,exam_id,subject_id,score)
select s.institute_id,s.section_id,s.id,e.exam_id,e.subject_id,
45+(right(s.admission_number,4)::int*7+right(e.subject_id::text,2)::int*3+right(e.exam_id::text,2)::int)%56
from public.students s join public.exam_subjects e on e.section_id=s.section_id;
insert into public.timetable(institute_id,section_id,subject_id,teacher_id,weekday,starts_at,ends_at,room)
select s.institute_id,s.id,sub.id,'20000000-0000-0000-0000-000000000002',d,
time '08:00' + (right(sub.id::text,2)::int-1+(right(s.id::text,2)::int-1)*3)*interval '45 minutes',
time '08:45' + (right(sub.id::text,2)::int-1+(right(s.id::text,2)::int-1)*3)*interval '45 minutes','Room '||right(s.id::text,1)
from public.sections s cross join public.subjects sub cross join generate_series(1,5) d;
insert into public.assignments(institute_id,section_id,subject_id,created_by,title,description,due_at)
select s.institute_id,s.id,sub.id,'20000000-0000-0000-0000-000000000002',sub.name||' practice',
'Complete the revision exercises and upload your working.',now()+interval '7 days' from public.sections s cross join public.subjects sub;
insert into public.fee_structures(institute_id,section_id,name,amount_paise,due_date)
select institute_id,id,'Term 1 tuition',1250000,current_date+14 from public.sections;
insert into public.fees(institute_id,section_id,student_id,structure_id)
select s.institute_id,s.section_id,s.id,f.id from public.students s join public.fee_structures f on f.section_id=s.section_id;
insert into public.payments(institute_id,student_id,fee_id,amount_paise,status,provider_reference,paid_at)
select f.institute_id,f.student_id,f.id,1250000,'succeeded','DEMO-'||s.admission_number,now()-interval '3 days'
from public.fees f join public.students s on s.id=f.student_id where right(s.admission_number,4)::int%3<>0;
insert into public.notices(institute_id,created_by,title,body) values
('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Welcome to the new term','Your class timetable and term assignments are now available.'),
('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Parent-teacher meeting','Please contact the school office to book your meeting slot.');
commit;

