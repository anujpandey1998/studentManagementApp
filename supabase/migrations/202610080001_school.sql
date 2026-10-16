-- Shared mobile/web contract. Apply with Supabase CLI; never from the app.
begin;
create type public.app_role as enum ('admin', 'teacher', 'student');
create type public.attendance_status as enum ('present', 'absent', 'late', 'excused');
create table public.institutes (
 id uuid primary key default gen_random_uuid(), name text not null, timezone text not null default 'Asia/Kolkata'
);
create table public.users (
 id uuid primary key references auth.users(id) on delete cascade,
 institute_id uuid not null references public.institutes(id),
 full_name text not null, role public.app_role not null, avatar_path text,
 created_at timestamptz not null default now(), unique(institute_id,id)
);
-- Roles are a protected enum on users: one institutional role per account.
create table public.classes (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null references public.institutes(id),
 name text not null, academic_year text not null, unique(institute_id,id), unique(institute_id,name,academic_year)
);
create table public.sections (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null,
 class_id uuid not null, name text not null,
 foreign key(institute_id,class_id) references public.classes(institute_id,id),
 unique(institute_id,id), unique(class_id,name)
);
create table public.subjects (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null references public.institutes(id),
 name text not null, code text not null, unique(institute_id,id), unique(institute_id,code)
);
create table public.teacher_allocations (
 institute_id uuid not null, section_id uuid not null, subject_id uuid not null, teacher_id uuid not null,
 primary key(section_id,subject_id,teacher_id),
 foreign key(institute_id,section_id) references public.sections(institute_id,id),
 foreign key(institute_id,subject_id) references public.subjects(institute_id,id),
 foreign key(institute_id,teacher_id) references public.users(institute_id,id)
);
create table public.students (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null, section_id uuid not null,
 user_id uuid, admission_number text not null, full_name text not null, date_of_birth date,
 guardian_name text, guardian_phone text, photo_path text, active boolean not null default true,
 created_at timestamptz not null default now(),
 foreign key(institute_id,section_id) references public.sections(institute_id,id),
 foreign key(institute_id,user_id) references public.users(institute_id,id),
 unique(user_id), unique(institute_id,id), unique(institute_id,id,section_id), unique(institute_id,admission_number)
);
create table public.attendance (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null, section_id uuid not null, student_id uuid not null,
 attendance_date date not null, status public.attendance_status not null, recorded_by uuid not null,
 foreign key(institute_id,student_id,section_id) references public.students(institute_id,id,section_id),
 foreign key(institute_id,recorded_by) references public.users(institute_id,id),
 unique(student_id,attendance_date)
);
create table public.exams (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null, section_id uuid not null,
 name text not null, exam_date date not null,
 foreign key(institute_id,section_id) references public.sections(institute_id,id),
 unique(institute_id,id,section_id)
);
create table public.exam_subjects (
 institute_id uuid not null, section_id uuid not null, exam_id uuid not null, subject_id uuid not null,
 max_marks numeric(6,2) not null check(max_marks > 0), primary key(exam_id,subject_id),
 foreign key(institute_id,exam_id,section_id) references public.exams(institute_id,id,section_id),
 foreign key(institute_id,subject_id) references public.subjects(institute_id,id),
 unique(institute_id,exam_id,section_id,subject_id)
);
create table public.marks (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null, section_id uuid not null,
 student_id uuid not null, exam_id uuid not null, subject_id uuid not null,
 score numeric(6,2) not null check(score >= 0),
 foreign key(institute_id,student_id,section_id) references public.students(institute_id,id,section_id),
 foreign key(institute_id,exam_id,section_id,subject_id) references public.exam_subjects(institute_id,exam_id,section_id,subject_id),
 unique(student_id,exam_id,subject_id)
);
create function public.validate_score() returns trigger language plpgsql set search_path = '' as $$
begin
 if new.score > (select max_marks from public.exam_subjects where exam_id = new.exam_id and subject_id = new.subject_id)
 then raise exception 'Score exceeds maximum marks'; end if;
 return new;
end $$;
create trigger validate_score before insert or update on public.marks for each row execute function public.validate_score();
create table public.timetable (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null, section_id uuid not null,
 subject_id uuid not null, teacher_id uuid not null, weekday smallint not null check(weekday between 1 and 7),
 starts_at time not null, ends_at time not null, room text, check(ends_at > starts_at),
 foreign key(institute_id,section_id) references public.sections(institute_id,id),
 foreign key(institute_id,subject_id) references public.subjects(institute_id,id),
 foreign key(institute_id,teacher_id) references public.users(institute_id,id),
 unique(section_id,weekday,starts_at)
);
create table public.assignments (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null, section_id uuid not null,
 subject_id uuid not null, created_by uuid not null, title text not null, description text not null,
 due_at timestamptz not null, attachment_path text, created_at timestamptz not null default now(),
 foreign key(institute_id,section_id) references public.sections(institute_id,id),
 foreign key(institute_id,subject_id) references public.subjects(institute_id,id),
 foreign key(institute_id,created_by) references public.users(institute_id,id),
 unique(institute_id,id,section_id)
);
create table public.submissions (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null, section_id uuid not null,
 assignment_id uuid not null, student_id uuid not null, file_path text not null,
 submitted_at timestamptz not null default now(), feedback text, graded_at timestamptz,
 foreign key(institute_id,assignment_id,section_id) references public.assignments(institute_id,id,section_id),
 foreign key(institute_id,student_id,section_id) references public.students(institute_id,id,section_id),
 unique(assignment_id,student_id)
);
create table public.fee_structures (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null, section_id uuid not null,
 name text not null, amount_paise bigint not null check(amount_paise > 0), due_date date not null,
 foreign key(institute_id,section_id) references public.sections(institute_id,id),
 unique(institute_id,id,section_id)
);
create table public.fees (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null, section_id uuid not null,
 student_id uuid not null, structure_id uuid not null,
 foreign key(institute_id,student_id,section_id) references public.students(institute_id,id,section_id),
 foreign key(institute_id,structure_id,section_id) references public.fee_structures(institute_id,id,section_id),
 unique(student_id,structure_id), unique(institute_id,id,student_id)
);
create table public.payments (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null, student_id uuid not null, fee_id uuid not null,
 amount_paise bigint not null check(amount_paise > 0), status text not null check(status in ('pending','succeeded','failed')),
 provider_reference text not null unique, paid_at timestamptz,
 foreign key(institute_id,fee_id,student_id) references public.fees(institute_id,id,student_id)
);
create table public.notices (
 id uuid primary key default gen_random_uuid(), institute_id uuid not null references public.institutes(id),
 section_id uuid, created_by uuid not null, title text not null, body text not null,
 published_at timestamptz not null default now(),
 foreign key(institute_id,section_id) references public.sections(institute_id,id),
 foreign key(institute_id,created_by) references public.users(institute_id,id)
);
-- Helpers read protected membership tables, avoiding recursive RLS.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create function private.is_admin(tenant uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.users where id = (select auth.uid()) and institute_id = tenant and role = 'admin')
$$;
create function private.is_member(tenant uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.users where id = (select auth.uid()) and institute_id = tenant)
$$;
create function private.teaches(tenant uuid, section uuid, subject uuid default null) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.teacher_allocations a join public.users u on u.id=a.teacher_id
 where u.id=(select auth.uid()) and u.role='teacher' and a.institute_id=tenant and a.section_id=section
 and (subject is null or a.subject_id=subject))
$$;
create function private.owns_student(tenant uuid, student uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.students where institute_id=tenant and id=student and user_id=(select auth.uid()))
$$;
create function private.in_section(tenant uuid, section uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.students where institute_id=tenant and section_id=section and user_id=(select auth.uid()))
$$;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

alter table public.institutes enable row level security;
revoke all on public.institutes from anon, authenticated;
grant select on public.institutes to authenticated;
grant insert, update, delete on public.institutes to authenticated;
create policy admin_manage on public.institutes for all to authenticated using(private.is_admin(id)) with check(private.is_admin(id));

alter table public.users enable row level security;
revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;
create policy admin_read on public.users for select to authenticated using(private.is_admin(institute_id));

alter table public.classes enable row level security;
revoke all on public.classes from anon, authenticated;
grant select on public.classes to authenticated;
grant insert, update, delete on public.classes to authenticated;
create policy admin_manage on public.classes for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.sections enable row level security;
revoke all on public.sections from anon, authenticated;
grant select on public.sections to authenticated;
grant insert, update, delete on public.sections to authenticated;
create policy admin_manage on public.sections for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.subjects enable row level security;
revoke all on public.subjects from anon, authenticated;
grant select on public.subjects to authenticated;
grant insert, update, delete on public.subjects to authenticated;
create policy admin_manage on public.subjects for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.teacher_allocations enable row level security;
revoke all on public.teacher_allocations from anon, authenticated;
grant select on public.teacher_allocations to authenticated;
grant insert, update, delete on public.teacher_allocations to authenticated;
create policy admin_manage on public.teacher_allocations for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.students enable row level security;
revoke all on public.students from anon, authenticated;
grant select on public.students to authenticated;
grant insert, update, delete on public.students to authenticated;
create policy admin_manage on public.students for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.attendance enable row level security;
revoke all on public.attendance from anon, authenticated;
grant select on public.attendance to authenticated;
grant insert, update, delete on public.attendance to authenticated;
create policy admin_manage on public.attendance for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.exams enable row level security;
revoke all on public.exams from anon, authenticated;
grant select on public.exams to authenticated;
grant insert, update, delete on public.exams to authenticated;
create policy admin_manage on public.exams for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.exam_subjects enable row level security;
revoke all on public.exam_subjects from anon, authenticated;
grant select on public.exam_subjects to authenticated;
grant insert, update, delete on public.exam_subjects to authenticated;
create policy admin_manage on public.exam_subjects for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.marks enable row level security;
revoke all on public.marks from anon, authenticated;
grant select on public.marks to authenticated;
grant insert, update, delete on public.marks to authenticated;
create policy admin_manage on public.marks for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.timetable enable row level security;
revoke all on public.timetable from anon, authenticated;
grant select on public.timetable to authenticated;
grant insert, update, delete on public.timetable to authenticated;
create policy admin_manage on public.timetable for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.assignments enable row level security;
revoke all on public.assignments from anon, authenticated;
grant select on public.assignments to authenticated;
grant insert, update, delete on public.assignments to authenticated;
create policy admin_manage on public.assignments for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.submissions enable row level security;
revoke all on public.submissions from anon, authenticated;
grant select on public.submissions to authenticated;
create policy admin_read on public.submissions for select to authenticated using(private.is_admin(institute_id));

alter table public.fee_structures enable row level security;
revoke all on public.fee_structures from anon, authenticated;
grant select on public.fee_structures to authenticated;
grant insert, update, delete on public.fee_structures to authenticated;
create policy admin_manage on public.fee_structures for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.fees enable row level security;
revoke all on public.fees from anon, authenticated;
grant select on public.fees to authenticated;
grant insert, update, delete on public.fees to authenticated;
create policy admin_manage on public.fees for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;
create policy admin_read on public.payments for select to authenticated using(private.is_admin(institute_id));

alter table public.notices enable row level security;
revoke all on public.notices from anon, authenticated;
grant select on public.notices to authenticated;
grant insert, update, delete on public.notices to authenticated;
create policy admin_manage on public.notices for all to authenticated using(private.is_admin(institute_id)) with check(private.is_admin(institute_id));

create policy self_read on public.users for select to authenticated using(id=(select auth.uid()));
create policy member_read on public.institutes for select to authenticated using(private.is_member(id));
create policy member_read on public.classes for select to authenticated using(private.is_member(institute_id));
create policy member_read on public.sections for select to authenticated using(private.is_member(institute_id));
create policy member_read on public.subjects for select to authenticated using(private.is_member(institute_id));
create policy teacher_read on public.teacher_allocations for select to authenticated using(teacher_id=(select auth.uid()));
create policy scoped_read on public.students for select to authenticated using(private.owns_student(institute_id,id) or private.teaches(institute_id,section_id));
create policy student_read on public.attendance for select to authenticated using(private.owns_student(institute_id,student_id));
create policy teacher_read on public.attendance for select to authenticated using(private.teaches(institute_id,section_id));
create policy student_read on public.marks for select to authenticated using(private.owns_student(institute_id,student_id));
create policy teacher_read on public.marks for select to authenticated using(private.teaches(institute_id,section_id,subject_id));
create policy student_read on public.fees for select to authenticated using(private.owns_student(institute_id,student_id));
create policy student_read on public.payments for select to authenticated using(private.owns_student(institute_id,student_id));
create policy student_read on public.submissions for select to authenticated using(private.owns_student(institute_id,student_id));
create policy teacher_read on public.submissions for select to authenticated using(private.teaches(institute_id,section_id));
create policy section_read on public.exams for select to authenticated using(private.in_section(institute_id,section_id) or private.teaches(institute_id,section_id));
create policy section_read on public.exam_subjects for select to authenticated using(private.in_section(institute_id,section_id) or private.teaches(institute_id,section_id));
create policy section_read on public.timetable for select to authenticated using(private.in_section(institute_id,section_id) or private.teaches(institute_id,section_id));
create policy section_read on public.assignments for select to authenticated using(private.in_section(institute_id,section_id) or private.teaches(institute_id,section_id));
create policy section_read on public.fee_structures for select to authenticated using(private.in_section(institute_id,section_id) or private.teaches(institute_id,section_id));
create policy teacher_insert on public.attendance for insert to authenticated with check(private.teaches(institute_id,section_id) and recorded_by=(select auth.uid()));
create policy teacher_update on public.attendance for update to authenticated using(private.teaches(institute_id,section_id)) with check(private.teaches(institute_id,section_id) and recorded_by=(select auth.uid()));
create policy teacher_insert on public.marks for insert to authenticated with check(private.teaches(institute_id,section_id,subject_id));
create policy teacher_update on public.marks for update to authenticated using(private.teaches(institute_id,section_id,subject_id)) with check(private.teaches(institute_id,section_id,subject_id));
create policy teacher_insert on public.assignments for insert to authenticated with check(private.teaches(institute_id,section_id,subject_id) and created_by=(select auth.uid()));
create policy teacher_update on public.assignments for update to authenticated using(private.teaches(institute_id,section_id,subject_id)) with check(private.teaches(institute_id,section_id,subject_id) and created_by=(select auth.uid()));

create policy audience_read on public.notices for select to authenticated using(private.is_member(institute_id) and (section_id is null or private.in_section(institute_id,section_id) or private.teaches(institute_id,section_id)));
create policy teacher_insert on public.notices for insert to authenticated with check(section_id is not null and private.teaches(institute_id,section_id) and created_by=(select auth.uid()));
-- Submissions use a trusted RPC in Phase 4, preventing students from changing feedback.
-- Payments are written only by an idempotent backend payment handler in Phase 5.
create index students_search on public.students(institute_id,full_name,id);
create index students_section on public.students(section_id);
create index attendance_month on public.attendance(student_id,attendance_date desc);
create index marks_student on public.marks(student_id,exam_id);
create index assignments_due on public.assignments(section_id,due_at);
create index notices_recent on public.notices(institute_id,published_at desc);
create index payments_fee on public.payments(fee_id);
commit;

